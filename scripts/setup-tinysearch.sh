if [ ! -f "scripts/setup-tinysearch.sh" ]; then
  echo "Error: You should use this command in project root."
  exit 1
fi

PROJECT_ROOT=$(pwd)

echo "Build project..."
echo "  => $ hugo --minify"
hugo --minify

echo "Make tinysearch..."
echo "  => $ tinysearch"
cd static/wasm
tinysearch ../../public/index.json
cd $PROJECT_ROOT