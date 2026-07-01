FROM debian:bookworm-slim

# install dependencies
RUN apt-get update && apt-get install -y \
  git \
  build-essential \
  cmake \
  libsqlite3-dev \
  zlib1g-dev \
  osmium-tool \
  jq \
  curl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# build tippecanoe
WORKDIR /tmp
RUN git clone https://github.com/felt/tippecanoe.git \
  && cd tippecanoe \
  && make -j$(nproc) \
  && make install \
  && cd .. \
  && rm -rf tippecanoe

WORKDIR /data
COPY build.sh /usr/local/bin/build.sh
RUN chmod +x /usr/local/bin/build.sh

ENTRYPOINT ["/usr/local/bin/build.sh"]
