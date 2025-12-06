#!/bin/zsh
# SSH tunnel: local 3307 -> VPS 127.0.0.1:3306 (MySQL)
ssh -L 3307:127.0.0.1:3306 root@72.62.35.188
