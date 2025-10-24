# Compile TypesScript source
npx tsc

# Copy templates over
New-Item -ItemType "Directory" -Force -Path "dist/templates"
Copy-Item -Path "src/templates/*" "dist/templates/" -Recurse
