#!/bin/bash
set -e

# default to Full US
OSM_PBF_URL="${OSM_PBF_URL:-https://download.geofabrik.de/north-america/us-latest.osm.pbf}"
OUTPUT_FILE="${OUTPUT_FILE:-parking.pmtiles}"
CACHE_FILE="/data/source.osm.pbf"
TMP_DIR=$(mktemp -d)

SKIP_DOWNLOAD=false
for arg in "$@"
do
    if [ "$arg" == "--skip-download" ]; then
        SKIP_DOWNLOAD=true
    fi
done

echo "Starting pipeline..."
echo "Source: $OSM_PBF_URL"
echo "Target: $OUTPUT_FILE"
echo "Cache File: $CACHE_FILE"

# download or use cache
if [ "$SKIP_DOWNLOAD" = true ] && [ -f "$CACHE_FILE" ]; then
    echo "Flag --skip-download set and cache exists. Using cached file..."
else
    echo "Downloading OSM PBF to cache..."
    curl -L -o "$CACHE_FILE" "$OSM_PBF_URL"
fi

# filter for parking features -- specifically, land/structures wholly dedicated to vehicle storage
#
# included:
#   amenity=parking             — surface lots and general parking areas
#   amenity=motorcycle_parking  — dedicated motorcycle/scooter parking areas
#   building=garages            — blocks of lockup garages (ex. rows serving a residential complex)
#   building=parking            — purpose-built parking structures (multi-story decks, garages)
#
# excluded (see jq filter below):
# by positive match only, so these value-based exclusions are applied on assembled features):
#   parking=street_side         — on-street parking zone along the road edge
#   parking=lane                — painted parking lane on a carriageway
#   parking=on_kerb             — spaces on or over the kerb
#   parking=half_on_kerb        — spaces straddling the kerb
#   parking=shoulder            — parking on the road shoulder
#   access=underground          — underground structures are not visible surface land
#   location=rooftop            — rooftop parking shares a footprint with the building below
echo "Filtering for parking data..."
osmium tags-filter "$CACHE_FILE" \
    "amenity=parking,motorcycle_parking" \
    "building=garages,parking" \
    -o "$TMP_DIR/parking-all.osm.pbf" --overwrite

# convert to GeoJSON for Tippecanoe
echo "Converting to GeoJSONSeq..."
osmium export "$TMP_DIR/parking-all.osm.pbf" \
    --geometry-types=polygon,multipolygon \
    -f geojsonseq \
    -o "$TMP_DIR/parking-raw.geojson.seq" --overwrite

echo "Filtering out exclusions"
jq -c --seq 'select(
  .properties.parking != "street_side" and
  .properties.parking != "lane" and
  .properties.parking != "on_kerb" and
  .properties.parking != "half_on_kerb" and
  .properties.parking != "shoulder" and
  .properties.access != "underground" and
  .properties.location != "rooftop"
)' "$TMP_DIR/parking-raw.geojson.seq" > "$TMP_DIR/parking.geojson.seq"

# https://github.com/mapbox/tippecanoe#discontinuous-polygon-features-buildings-of-rhode-island-visible-at-all-zoom-levels
echo "Generating PMTiles..."
tippecanoe -o "/data/$OUTPUT_FILE" \
    --force \
    -l "parking" \
    -zg \
    --drop-densest-as-needed \
    --extend-zooms-if-still-dropping \
    "$TMP_DIR/parking.geojson.seq"

# cleanup
rm -rf "$TMP_DIR"

echo "Done! Output at /data/$OUTPUT_FILE"
