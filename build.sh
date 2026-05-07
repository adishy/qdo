#!/bin/bash

# Exit on any error
set -e

IMAGE_NAME="qdo-pwa"
CONTAINER_NAME="qdo-instance"
PORT="5000"
RUN_CONTAINER=false

# Try to get host IP (works on macOS and most Linux)
if command -v ipconfig > /dev/null; then
    HOST_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "your-host-ip")
elif command -v ip > /dev/null; then
    HOST_IP=$(ip route get 1.1.1.1 | awk -F"src " 'NR==1{split($2,a," ");print a[1]}' 2>/dev/null || echo "your-host-ip")
else
    HOST_IP="your-host-ip"
fi

# Parse arguments
for arg in "$@"
do
    case $arg in
        --run)
        RUN_CONTAINER=true
        shift
        ;;
    esac
done

echo "🔨 Building Docker image '$IMAGE_NAME'..."
docker build -t $IMAGE_NAME .
echo "✅ Build complete!"

if [ "$RUN_CONTAINER" = true ]; then
    echo "🧹 Removing any existing container named '$CONTAINER_NAME'..."
    docker rm -f $CONTAINER_NAME 2>/dev/null || true

    echo "🚀 Starting new container on port $PORT..."
    docker run -d -p $PORT:80 --name $CONTAINER_NAME $IMAGE_NAME
    echo "🌐 Application is now running!"
    echo "   Local:   http://localhost:$PORT"
    if [ "$HOST_IP" != "your-host-ip" ]; then
        echo "   Network: http://$HOST_IP:$PORT"
    fi
else
    echo "🚀 To run the application manually, execute:"
    echo "docker run -d -p $PORT:80 --name $CONTAINER_NAME $IMAGE_NAME"
    echo "🌐 Then open http://localhost:$PORT or http://$HOST_IP:$PORT in your browser."
fi
