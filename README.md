# OpenWriter

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/license-Non--Commercial-orange.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<p align="center">
  <strong>🚀 A modern, open-source document editor built with Tauri, React & TypeScript</strong>
</p>

<p align="center">
  OpenWriter is a powerful, cross-platform desktop document editor that combines the speed of native applications with modern web technologies. Create, edit, and export documents with AI-powered writing assistance.
</p>

---

## ✨ Features

- 📝 **Rich Text Editing** - Full-featured editor powered by CKEditor 5 with formatting, lists, tables, and more
- 📄 **Multiple Format Support** - Import/Export DOCX, PDF, and HTML files
- 📐 **Paged View** - Realistic document preview with page layouts
- 🤖 **AI Writing Assistant** - Rewrite, summarize, and continue writing with Groq AI
- 🎨 **Modern UI** - Clean, responsive interface with dark/light themes
- 🖥️ **Cross-Platform** - Runs natively on Windows, macOS, and Linux
- ⚡ **Lightning Fast** - Native performance with Tauri's Rust backend
- 🔒 **Privacy First** - Your documents stay on your machine

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4 |
| **Editor** | CKEditor 5 |
| **Backend** | Tauri 2, Rust |
| **Document Processing** | docx, mammoth, jsPDF, html2canvas |
| **AI Integration** | Groq API (Llama models) |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software | Version | Installation Link |
|----------|---------|-------------------|
| **Node.js** | v18.0+ | [Download Node.js](https://nodejs.org/) |
| **npm** | v9.0+ | Comes with Node.js |
| **Rust** | Latest stable | [Install Rust](https://rustup.rs/) |
| **Git** | Any recent | [Download Git](https://git-scm.com/) |

### Platform-Specific Requirements

<details>
<summary><strong>🪟 Windows</strong></summary>

1. **Visual Studio Build Tools 2019+**
   - Download from [Visual Studio Downloads](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - During installation, select **"Desktop development with C++"**

2. **WebView2 Runtime**
   - Usually pre-installed on Windows 10/11
   - If needed: [Download WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

</details>

<details>
<summary><strong>🍎 macOS</strong></summary>

1. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

</details>

<details>
<summary><strong>🐧 Linux (Ubuntu/Debian)</strong></summary>

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

</details>

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/RKG765/OpenWriter.git
cd OpenWriter
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This will install all frontend dependencies including:
- React & React DOM
- CKEditor 5
- Tauri plugins (dialog, fs, opener)
- Document processing libraries (docx, mammoth, jsPDF)
- Development tools (Vite, TypeScript, Tailwind CSS)

### Step 3: Install Rust Dependencies

The Rust dependencies will be automatically installed when you first run or build the app. However, you can pre-install them:

```bash
cd src-tauri
cargo fetch
cd ..
```

### Step 4: Verify Installation

```bash
# Check Node.js
node --version  # Should be v18.0.0 or higher

# Check npm
npm --version   # Should be v9.0.0 or higher

# Check Rust
rustc --version # Should show latest stable version

# Check Cargo
cargo --version
```

---

## ▶️ Running the Application

### Development Mode (Recommended for Development)

```bash
npm run tauri dev
```

This command will:
1. Start the Vite development server with hot-reload
2. Compile the Rust backend
3. Launch the OpenWriter application

> **Note:** The first run may take several minutes as Rust compiles all dependencies.

### Frontend Only (For UI Development)

```bash
npm run dev
```

Opens the app in your browser at `http://localhost:1420` (without Tauri backend features).

### Production Build

```bash
npm run tauri build
```

The compiled installers will be available in:
```
src-tauri/target/release/bundle/
├── msi/           # Windows installer
├── dmg/           # macOS installer
├── deb/           # Debian/Ubuntu package
└── AppImage/      # Linux AppImage
```

---

## ⚙️ Environment Variables & Configuration

### API Key Setup (For AI Features)

OpenWriter uses **Groq API** for AI writing assistance. The API key is configured within the app:

1. **Get a Free API Key:**
   - Visit [console.groq.com](https://console.groq.com)
   - Create a free account
   - Generate an API key

2. **Configure in OpenWriter:**
   - Open the application
   - Click the **⚙️ settings icon** in the AI Sidebar
   - Enter your Groq API key
   - Click **Save Key**

> **Note:** The API key is stored securely in your browser's localStorage and never leaves your device except when making API calls.

### Optional Environment Variables

Create a `.env` file in the root directory for development customization:

```env
# Development server port (default: 1420)
VITE_DEV_SERVER_PORT=1420

# Enable debug logging
VITE_DEBUG=true
```

### Tauri Configuration

Main configuration is in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "OpenWriter",
  "version": "0.1.0",
  "identifier": "com.openwriter.app"
}
```

---

## 📁 Project Structure

```
OpenWriter/
├── src/                        # React frontend
│   ├── components/
│   │   ├── Editor.tsx          # Main CKEditor wrapper
│   │   ├── Toolbar.tsx         # Document toolbar & actions
│   │   ├── PagedView.tsx       # Page layout preview
│   │   ├── StatusBar.tsx       # Bottom status bar
│   │   └── AISidebar.tsx       # AI writing assistant
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API & utility services
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Global styles
│   └── main.tsx                # Entry point
│
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── lib.rs              # Library entry
│   │   └── main.rs             # Application entry
│   ├── capabilities/           # Tauri security permissions
│   ├── icons/                  # App icons
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
│
├── public/                     # Static assets
├── package.json                # Node.js dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
└── .gitignore                  # Git ignore rules
```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server only |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run tauri dev` | Run full app in development mode |
| `npm run tauri build` | Build native application installers |

---

## 🗺️ Roadmap & Future Scope

### 🎯 Version 0.2.0 (Planned)
- [ ] **Cloud Sync** - Google Drive / OneDrive integration
- [ ] **Real-time Collaboration** - Multiple users editing simultaneously
- [ ] **Custom Templates** - Document templates for various use cases
- [ ] **Spell Check** - Built-in spell checking and grammar suggestions

### 🎯 Version 0.3.0 (Planned)
- [ ] **Plugin System** - Extensible architecture for community plugins
- [ ] **Markdown Support** - Native markdown editing and preview
- [ ] **Version History** - Track document changes over time
- [ ] **Comments & Annotations** - Collaborative review features

### 🎯 Version 1.0.0 (Vision)
- [ ] **Mobile Apps** - iOS and Android companion apps
- [ ] **End-to-End Encryption** - Secure document storage
- [ ] **Offline AI** - Local AI models for privacy-focused users
- [ ] **Advanced Export** - ePub, LaTeX, and more formats
- [ ] **Accessibility** - Full WCAG 2.1 compliance
- [ ] **Localization** - Multi-language support

### 💡 Feature Requests

Have an idea? [Open a feature request](https://github.com/RKG765/OpenWriter/issues/new?labels=enhancement)!

---

## 🛠️ What You Can Implement (Contributor Ideas)

Looking to contribute? Here are features you can pick up and implement:

### 🟢 Beginner Friendly (Good First Issues)

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **Dark/Light Theme Toggle** | Add UI toggle for theme switching | React, CSS |
| **Word Count Display** | Real-time word/character count in status bar | React |
| **Keyboard Shortcuts Help** | Modal showing all available shortcuts | React, HTML |
| **Recent Files List** | Show recently opened documents | React, localStorage |
| **Print Document** | Add print functionality | Browser API |
| **Auto-Save Indicator** | Visual feedback when document is saved | React |

### 🟡 Intermediate

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **Find & Replace** | Search and replace text within document | CKEditor API, React |
| **Custom Fonts** | Allow users to add/use custom fonts | CSS, React |
| **Table of Contents** | Auto-generate TOC from headings | CKEditor, React |
| **Document Statistics** | Reading time, paragraph count, etc. | React |
| **Zoom Controls** | Zoom in/out on document view | CSS, React |
| **Spell Check Integration** | Integrate browser spell check or external API | CKEditor, API |
| **Image Resize Handles** | Allow resizing images in editor | CKEditor plugins |
| **Export to Markdown** | Convert document to .md format | Turndown.js |

### 🔴 Advanced

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **Plugin System** | Architecture for loading community plugins | React, TypeScript |
| **Collaborative Editing** | Real-time multi-user editing | WebSocket, CRDT |
| **Version History** | Track and restore document versions | IndexedDB, React |
| **Cloud Sync** | Google Drive / OneDrive integration | OAuth, REST APIs |
| **Offline AI Models** | Run AI locally using ONNX/Ollama | Rust, WASM |
| **Custom Templates** | Template creation and management system | React, File system |
| **Accessibility Audit** | WCAG 2.1 compliance improvements | ARIA, Semantic HTML |

### 🚀 How to Pick a Feature

1. **Comment on an issue** expressing your interest
2. **Fork the repo** and create a feature branch
3. **Implement** with tests if applicable
4. **Open a PR** with screenshots/demos
5. **Iterate** based on feedback

---

## 🤝 Contributing

We welcome contributions from everyone! Here's how you can help:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/OpenWriter.git
   ```
3. **Create** a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make** your changes
5. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push** to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

### Contribution Ideas

- 🐛 **Bug Fixes** - Check [open issues](https://github.com/RKG765/OpenWriter/issues)
- 📖 **Documentation** - Improve docs, add examples
- 🌍 **Translations** - Help translate the app
- 🎨 **UI/UX** - Design improvements
- ⚡ **Performance** - Optimize code and reduce bundle size

---

## 🐛 Known Issues

- PDF export may have minor styling differences from editor view
- Large documents (100+ pages) may experience slight performance slowdown
- Some complex DOCX formatting may not import perfectly

---

## 📄 License

This project is licensed under a **Custom Non-Commercial License** - see the [LICENSE](LICENSE) file for details.

**In summary:**
- ✅ Free for personal & educational use
- ✅ Contributions welcome
- ⚠️ Attribution required
- ❌ Commercial use requires permission from [@RKG765](https://github.com/RKG765)

---

## 💬 Support & Community

- 🐛 **Bug Reports:** [Open an Issue](https://github.com/RKG765/OpenWriter/issues)
- 💡 **Feature Requests:** [Start a Discussion](https://github.com/RKG765/OpenWriter/discussions)
- 📧 **Email:** [Contact Maintainer](mailto:your-email@example.com)

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Lightweight, secure desktop framework
- [CKEditor 5](https://ckeditor.com/ckeditor-5/) - Professional rich text editor
- [React](https://react.dev/) - UI component library
- [Groq](https://groq.com/) - Fast AI inference
- All our amazing [contributors](https://github.com/RKG765/OpenWriter/graphs/contributors)!

---

<p align="center">
  <strong>⭐ Star this repo if you find it useful! ⭐</strong>
</p>

<p align="center">
  Made with ❤️ by <a href="https://github.com/RKG765">RKG765</a> and the open-source community
</p>
