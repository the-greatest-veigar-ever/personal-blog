# Personal Blog

A lightweight, zero-dependency blogging platform built with Vanilla JavaScript and Firebase. Designed for performance, maintainability, and a distraction-free writing experience.

## Architecture

The application checks the following architectural boxes:
- **Core Runtime**: Vanilla JavaScript (ES6+) for maximum performance and zero build-step overhead.
- **State Management**: Custom lightweight Controller pattern (`PostController`, `LockController`, `UIController`) with an Event Bus for loose coupling.
- **Persistence**: Firebase Firestore for real-time data syncing and storage.
- **Editor**: Integrated Quill.js instance with custom bindings for markdown-like shortcuts and structure.
- **Security**: Client-side inactivity monitoring and PIN-based overlay (`LockController`) to secure the session state.

## Tech Stack

- **Frontend**: HTML5, CSS3 (CSS Variables for theming), JavaScript (ES Modules).
- **Backend / BaaS**: Firebase Hosting & Firestore.
- **External Libs**: Quill.js (Rich Text Editor).
- **Testing**: Jest (Integration & Unit tests).

## Key Features

1.  **Distraction-Free Editor**: Full-screen writing interface with custom key bindings (e.g., Tab indentation handling).
2.  **Privacy/Security Module**:
    -   Configurable **Screen Lock** with 4 or 6-digit PIN.
    -   Auto-lock trigger based on user inactivity (configurable timeout).
    -   Strict input validation and secure overlay rendering.
3.  **Theme Engine**: Native CSS Variable implementation for seamless Light/Dark mode switching.
4.  **Local & Remote Sync**: Hybrid storage strategy leveraging `localStorage` for preferences and Firestore for content.

## Setup & Development

### Prerequisites
- Node.js (v14+)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
git clone https://github.com/the-greatest-veigar-ever/personal-blog.git
cd personal-blog
npm install
```

### Local Development

Start the development server:

```bash
npm start
```

Runs on `http://localhost:8080` by default.

### Deployment

Deploy to Firebase Hosting:

```bash
npm run deploy
```

## License

MIT License.
