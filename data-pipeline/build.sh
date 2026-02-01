#!/bin/bash
set -e

# default to Full US
OSM_PBF_URL="${OSM_PBF_URL:-https://download.geofabrik.de/north-america/us-latest.osm.pbf}"
OUTPUT_FILE="${OUTPUT_FILE:-parking.pmtiles}"
TMP_DIR=$(mktemp -d)

echo "Starting pipeline..."
echo "Source: $OSM_PBF_URL"
echo "Target: $OUTPUT_FILE"

# 1. Download
echo "Downloading OSM PBF..."
curl -L -o "$TMP_DIR/source.osm.pbf" "$OSM_PBF_URL"

# 2. Filter for parking
# keeping amenity=parking
# excluding underground and rooftop
echo "Filtering for parking data..."
osmium tags-filter "$TMP_DIR/source.osm.pbf" \
    "amenity=parking" \
    -o "$TMP_DIR/parking-all.osm.pbf" --overwrite

# 3. Convert to GeoJSON (Sequence) for Tippecanoe
# Tippecanoe can read some formats, but osmium export -> geojsonseq is robust
echo "Converting to GeoJSONSeq..."
osmium export "$TMP_DIR/parking-all.osm.pbf" \
    --geometry-types=polygon,multipolygon \
    -f geojsonseq \
    -o "$TMP_DIR/parking.geojson.seq" --overwrite

# 4. Generate PMTiles
echo "Generating PMTiles..."
# -zg: auto-detect zoom
# --drop-densest-as-needed: Drop features if too dense (crucial for whole world)
# --extend-zooms-if-still-dropping: Ensure visibility
# --force: Overwrite existing file
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
