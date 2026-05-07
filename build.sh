#!/bin/bash

# Exit on any error
set -e

IMAGE_NAME="qdo-pwa"
CONTAINER_NAME="qdo-instance"
PORT="5000"
RUN_CONTAINER=false

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
    echo "🌐 Application is now running at http://localhost:$PORT"
else
    echo "🚀 To run the application manually, execute:"
    echo "docker run -d -p $PORT:80 --name $CONTAINER_NAME $IMAGE_NAME"
    echo "🌐 Then open http://localhost:$PORT in your browser."
fi
