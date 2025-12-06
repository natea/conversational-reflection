#!/bin/bash
cd pipecat; 
uv run bot.py --transport webrtc &
cp ../ginger_rp/.env.local.example ../ginger_rp/.env.local
cd ../ginger_rp;
npm i
npm run dev &