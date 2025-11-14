# Stage 1: Build Janus
FROM debian:bookworm-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    libmicrohttpd-dev \
    libjansson-dev \
    libssl-dev \
    libsrtp2-dev \
    libsofia-sip-ua-dev \
    libglib2.0-dev \
    libopus-dev \
    libogg-dev \
    libcurl4-openssl-dev \
    liblua5.3-dev \
    libconfig-dev \
    pkg-config \
    gengetopt \
    libtool \
    automake \
    build-essential \
    wget \
    libnice-dev

# Clone Janus source code
RUN git clone https://github.com/meetecho/janus-gateway.git /opt/janus-gateway

# Build and install
WORKDIR /opt/janus-gateway
RUN ./autogen.sh
RUN ./configure --prefix=/usr --disable-websockets --disable-data-channels --disable-rabbitmq --disable-docs --disable-mqtt
RUN make
RUN make install

# Stage 2: Create the final image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libmicrohttpd12 \
    libjansson4 \
    libssl3 \
    libsrtp2-1 \
    libsofia-sip-ua0 \
    libglib2.0-0 \
    libopus0 \
    libogg0 \
    libcurl4 \
    liblua5.3-0 \
    libconfig9 \
    wget

# Copy built Janus from the builder stage
COPY --from=builder /usr /usr

# Copy Janus configurations
COPY --from=builder /opt/janus-gateway/conf/ /usr/etc/janus/

# Create a default config if it doesn't exist
RUN [ ! -f /usr/etc/janus/janus.jcfg ] && cp /usr/etc/janus/janus.jcfg.sample /usr/etc/janus/janus.jcfg || true
RUN [ ! -f /usr/etc/janus/janus.transport.http.jcfg ] && cp /usr/etc/janus/janus.transport.http.jcfg.sample /usr/etc/janus/janus.transport.http.jcfg || true

# Expose ports
EXPOSE 8088 8188

# Set the entrypoint
CMD ["/usr/bin/janus"]
