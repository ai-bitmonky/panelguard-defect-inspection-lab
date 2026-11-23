#!/bin/sh
# GitHub Pages serves the lab from /docs. Run this after changing site/ so docs/ is the same.
cd "$(dirname "$0")/.." && rm -rf docs && cp -r site docs && touch docs/.nojekyll && echo "docs/ synced from site/"
