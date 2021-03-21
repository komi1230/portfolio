if [ ! -f "scripts/setup-tinysearch.sh" ]; then
  echo "Error: You should use this command in project root."
  exit 1
fi

if [ ! -f "public/index.json" ]; then
  echo "Build project..."
  echo "  => $ hugo"
  hugo
fi

PROJECT_ROOT=$(pwd)



echo "Make tinysearch..."
echo "  => $ tinysearch"
cd static/wasm
tinysearch -o ../../public/index.json
cd $PROJECT_ROOT