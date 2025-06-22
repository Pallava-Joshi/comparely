# Grocery Automation Backend

This project uses Puppeteer to automate login and cart retrieval from online grocery platforms like Zepto and Blinkit. Redis is used for caching session data, and MongoDB is used for persistent storage.

## 📦 Prerequisites

- Node.js (v18+ recommended)
- Docker (for MongoDB & Redis)
- `npm` or `yarn`

---

## 🛠️ Steps to Start the Server

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/comparely.git
cd comparely

npm install

cp .env.example .env
```
# Start Redis
```docker run -d \
  --name redis-container \
  -p 6379:6379 \
  redis
```
# Start MongoDB
```docker run -d \
  --name mongo-container \
  -p 27017:27017 \
  mongo:7
```
```
npm run dev

```
Check out this YouTube video for a walkthrough of how this backend system works:

[▶️ Watch Here](https://youtu.be/KEaEE2Spv-I)
