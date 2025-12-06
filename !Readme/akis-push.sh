#!/bin/zsh
# Add, commit, and push all Akis changes
cd ~/akis

git add .
msg="Akis auto-commit $(date '+%Y-%m-%d %H:%M')"
git commit -m "$msg" || echo "Nothing to commit"
git push origin main
