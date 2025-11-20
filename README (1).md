
# MemeCoin Aggregator — Real-Time DEX Data Backend
Live API: https://memecoin-aggregetor.onrender.com

GitHub Repo: https://github.com/saggy0308/memecoin-aggregetor

This project implements a lightweight backend service for aggregating real-time meme-coin data from multiple DEX sources.
It’s designed to behave similarly to Axiom Trade’s “Discover” page — where token data is fetched from different providers, merged, cached, and updated live over WebSockets.

The system is built with Node.js, TypeScript, Socket.io, and Redis (Upstash), and deployed on Render.




## Overview
The system collects token information from DexScreener and Jupiter, merges the results, caches them, and distributes updates in real time through WebSockets.
A background poller runs every few seconds to detect price/volume changes and broadcasts only the differences to connected clients.

This architecture keeps the API responsive while minimizing load on third-party providers.
## Overview
The system collects token information from DexScreener and Jupiter, merges the results, caches them, and distributes updates in real time through WebSockets.
A background poller runs every few seconds to detect price/volume changes and broadcasts only the differences to connected clients.

This architecture keeps the API responsive while minimizing load on third-party providers.
## Key Features
#### Real-time data aggregation

- DexScreener API (pairs + token data)

- Jupiter API (price + token info)

- Duplicate data is normalized into a single token object.

#### Caching

- Redis (Upstash) used as a cache layer with a 30-second TTL.

- Cache-aside strategy to avoid redundant API requests.

- Polling uses cached copies to detect changes.

#### WebSocket updates

- Clients receive live token price/volume updates.

- Each client can define its own subscription filter (e.g., q=bonk).

- Only relevant updates are pushed to that client, reducing noise.

#### Background polling

- Polls multiple tokens every 10 seconds.

- Identifies “significant” updates (e.g., price change, volume spike).

- Emits diff updates through WS and stores updated values in Redis.

#### REST API

- /discover endpoint supports:

- text search (q)

- sorting (market cap, volume, price change)

- cursor-based pagination

- optional time period filtering (e.g., 1h)
## Architecure
#### Components:

- Aggregator – merges DEX data into a unified token structure

- Redis cache – avoids repeated external API hits

- Poller – continuously refreshes data in the background

- Socket.io – streams token diffs to clients

- Express API – exposes discover endpoints for initial page loads
## Running Locally
#### 1. Clone the repo
git clone https://github.com/saggy0308/memecoin-aggregetor \
cd memecoin-aggregetor 
#### 2. Install dependencies
npm install
#### 3. Set environment variables
REDIS_URL=redis://default:YOUR_TOKEN@YOUR_UPSTASH_URL:6379
#### 4. Run
npm run dev

## API Endpoints
#### Health
GET /health

#### Discover
GET /discover?q=bonk&sort=volume_desc&limit=20&cursor=...

## Web Socket Usage
    const socket = io("https://memecoin-aggregetor.onrender.com");
    socket.emit("subscribe", { q: "bonk" });

    socket.on("token_update", (update) => {

    console.log(update);
    });
## Design Notes
- Redis caching is used to avoid hitting public APIs at high frequency.

- Only significant changes trigger WebSocket updates to reduce noise.

- Token data from DexScreener and Jupiter is merged to provide a more complete view of each coin.

- Poller + WebSockets replicate the “live UI” behavior seen in crypto dashboards.
## Status
- All assignment requirements implemented:

- REST API

- WebSocket server

- Real-time polling + update streaming

- Filtering, sorting, pagination

- Redis caching

- Deployment with public URL

- GitHub repo with commit history