#!/usr/bin/env bash

npm install --ignore-scripts
rm node_modules/oniguruma/binding.gyp
npm install
npm run vscode:prepublish

