#!/bin/zsh
# SSH tunnel: local 4100 -> VPS 127.0.0.1:4100 (Akis API)
ssh -L 4100:127.0.0.1:4100 root@72.62.35.188
