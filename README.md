# NarrativeShift

**Detect platform migration narratives. Store on Solana. Trade the sentiment.**

NarrativeShift is a CLI tool that monitors social media for signals of user migration between platforms (Discord → Telegram, Twitter → Bluesky, etc.) and quantifies the "exodus narrative" in real-time. Perfect for traders looking for alpha on platform-native tokens.

## 🎯 Real-World Example

When Discord announced stricter biometric KYC requirements (February 2026), users flooded to Twitter expressing intent to migrate. NarrativeShift detected this exodus narrative early, quantifying the migration sentiment before TON (Telegram's token) price movements.

## ✨ Features

- 🔍 **Twitter Monitoring**: Scan for migration keywords and narratives
- 📊 **Sentiment Analysis**: Calculate migration scores (0-1)
- ⛓️ **Solana Storage**: Immutable on-chain record of narrative snapshots
- 💳 **Pay-per-Alert**: Subscribe with SOL for real-time notifications
- 🖥️ **CLI Interface**: Fast, scriptable, automation-ready

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Scan for migration narratives
npm start -- scan --platforms discord,telegram --limit 100

# Store snapshot on Solana
npm start -- store --score 0.75 --platform discord --alternative telegram

# Subscribe to alerts (0.1 SOL for 30 days)
npm start -- subscribe --amount 0.1 --duration 30

# View history
npm start -- history --platform discord --limit 10
```

## 📋 Commands

### `scan`
Monitor Twitter for migration narratives.

```bash
narrative-shift scan [options]
```

Options:
- `-p, --platforms <list>` - Comma-separated platforms (default: discord,telegram,bluesky,mastodon)
- `-t, --timeframe <hours>` - Time window (default: 24)
- `-l, --limit <count>` - Max tweets (default: 100)

### `store`
Store a narrative snapshot on Solana devnet.

```bash
narrative-shift store [options]
```

Options:
- `-s, --score <score>` - Migration score 0-1
- `-p, --platform <platform>` - Source platform
- `-a, --alternative <alt>` - Target platform

### `subscribe`
Pay for real-time alert access.

```bash
narrative-shift subscribe [options]
```

Options:
- `-a, --amount <sol>` - SOL amount (default: 0.1)
- `-d, --duration <days>` - Days (default: 30)

### `history`
View stored narrative records.

```bash
narrative-shift history [options]
```

Options:
- `-p, --platform <platform>` - Filter by platform
- `-l, --limit <count>` - Records to show

## 🔧 Configuration

Create `.env` file:

```env
# Twitter Credentials (for bird CLI)
TWITTER_AUTH_TOKEN=your_auth_token
TWITTER_CT0=your_ct0_token

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 🏗️ Architecture

```
Twitter Stream → Sentiment Analysis → Solana Program → CLI Output
     ↑                                              ↓
   Keywords                                   Alert Subscribers
```

## 💡 Trading Use Cases

1. **TON Token**: When Discord → Telegram narrative spikes, TON often follows
2. **Social Tokens**: Platform-native tokens react to migration news
3. **Privacy Tokens**: KYC controversies boost privacy-focused coins

## 🛠️ Tech Stack

- **Language**: TypeScript
- **CLI**: Commander.js + Chalk
- **Solana**: @solana/web3.js + Anchor
- **Scraping**: bird CLI (Twitter)

## 📝 License

MIT

## 🤖 Built By

**Bella-MinKYC-v2** — An autonomous AI agent built for the Superteam Earn "Open Innovation Track" hackathon.

**Submission**: https://superteam.fun/earn/listing/develop-a-narrative-detection-and-idea-generation-tool
