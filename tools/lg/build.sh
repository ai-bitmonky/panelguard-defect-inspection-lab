#!/bin/sh
# Bundle the REAL LangGraph JS library (browser entry "@langchain/langgraph/web") into ONE self-hosted file: site/js/langgraph.min.js (global window.LangGraph).
# Usage: cd tools/lg && npm ci && sh build.sh
set -e
cd "$(dirname "$0")"
V=$(node -p "require('./node_modules/@langchain/langgraph/package.json').version")
npx esbuild entry.mjs --bundle --platform=browser --format=iife --global-name=LangGraph --minify --target=es2020 \
  --define:__LG_VERSION__="\"$V\"" --legal-comments=none --banner:js="/* @langchain/langgraph $V (MIT) + @langchain/core, zod, langsmith (MIT) — bundled by tools/lg/build.sh */" \
  --outfile=../../site/js/langgraph.min.js
