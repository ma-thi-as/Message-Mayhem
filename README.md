# Message Mayhem

A real-time communication platform leveraging modern web technologies for seamless messaging and audio streaming.

## 🚀 Features

- Server-side rendering with Express.js and EJS templating
- Real-time bidirectional communication using Socket.IO
- Peer-to-peer connections with WebRTC API
- Audio streaming capabilities via MediaStream API
- Robust data persistence using MongoDB and Redis
- User authentication and session management
- Friend system and chat room functionality

## 🛠️ Technologies

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, TailwindCSS
- **Real-time Communication**: Socket.IO, WebRTC
- **Databases**: Mongo Atlas, Redis
- **Authentication**: Passport.js (Local & GitHub strategies)
- **Build Tools**: PostCSS, Tailwindcli

## 📋 Prerequisites

- Node.js (Latest LTS version recommended)
- Mongo Atlas or MongoDB
- Redis

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/message-mayhem.git
cd message-mayhem
```

2. Install dependencies:
```bash
npm install
```

3. Check a `.env.dev` file in the root directory with the following variables:
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
...
```

4. Build the CSS:
```bash
npm run build:css
```

## 🎯 Running the Application

### Development Mode
```bash
npm run start-dev
```

### Production Mode
```bash
npm start
```

### Watch CSS Changes
```bash
npm run watch:css
```

## 📁 Project Structure

```
src/
├── app.js              # Application entry point
├── public/             # Static files
│   └── css/           # CSS files
├── views/             # EJS templates
└── routes/            # Express routes
```


## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
