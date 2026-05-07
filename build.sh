#!/bin/bash

# Exit on any error
set -e

IMAGE_NAME="qdo-pwa"
PORT="8080"

echo "🔨 Building Docker image '$IMAGE_NAME'..."
docker build -t $IMAGE_NAME .

echo "✅ Build complete!"
echo "🚀 To run the application, execute:"
echo "docker run -d -p $PORT:80 --name qdo-instance $IMAGE_NAME"
echo "🌐 Then open http://localhost:$PORT in your browser."