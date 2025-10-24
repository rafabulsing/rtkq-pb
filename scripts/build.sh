# Compile TypeScript source
npx tsc

# Copy templates over
mkdir -p dist/templates
cp -rf src/templates/* dist/templates/
