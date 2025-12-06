#!/bin/bash
cd pipecat; 
uv run bot.py --transport webrtc &

cd ../ginger_rp;
npm i
npm run dev &