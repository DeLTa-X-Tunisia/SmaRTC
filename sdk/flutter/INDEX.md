# 📚 SmaRTC Flutter SDK - Documentation Index

Welcome to the SmaRTC Flutter SDK documentation! This index helps you find what you need quickly.

---

## 🚀 Getting Started

**New to SmaRTC?** Start here:

1. **[SDK_OVERVIEW.md](SDK_OVERVIEW.md)** - What is SmaRTC and why use it?
2. **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 5 minutes
3. **[README.md](README.md)** - Complete documentation and API reference

---

## 📖 Core Documentation

### For Users

| Document | Description | When to Use |
|----------|-------------|-------------|
| **[README.md](README.md)** | Complete SDK documentation | Reference guide, API docs |
| **[QUICKSTART.md](QUICKSTART.md)** | Quick start guide | First-time setup |
| **[SDK_OVERVIEW.md](SDK_OVERVIEW.md)** | SDK overview and features | Understanding the SDK |

### For Developers

| Document | Description | When to Use |
|----------|-------------|-------------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Technical architecture | Understanding internals |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Contribution guidelines | Contributing code |
| **[MIGRATION.md](MIGRATION.md)** | Migration guide | Integrating/migrating |

### Project Management

| Document | Description | When to Use |
|----------|-------------|-------------|
| **[CHANGELOG.md](CHANGELOG.md)** | Version history | Tracking changes |
| **[VALIDATION.md](VALIDATION.md)** | Testing checklist | QA and validation |
| **[SUMMARY.md](SUMMARY.md)** | Development summary | Project overview |

---

## 🎯 By Use Case

### "I want to add video calling to my app"
1. Read [QUICKSTART.md](QUICKSTART.md)
2. Run [setup.ps1](setup.ps1)
3. Follow the integration steps
4. Check [example/](example/) for reference

### "I'm migrating from another service"
1. Read [MIGRATION.md](MIGRATION.md)
2. Find your current service (Agora, Twilio, Jitsi)
3. Follow the migration steps
4. Test with [VALIDATION.md](VALIDATION.md)

### "I want to understand how it works"
1. Read [SDK_OVERVIEW.md](SDK_OVERVIEW.md)
2. Study [ARCHITECTURE.md](ARCHITECTURE.md)
3. Explore the code in [lib/](lib/)
4. Run the [example/](example/) app

### "I want to contribute"
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Fork the repository
3. Make your changes
4. Submit a pull request

### "I need help troubleshooting"
1. Check [VALIDATION.md](VALIDATION.md) - Common issues
2. Review [README.md](README.md) - Troubleshooting section
3. Check example app works
4. Open an issue on GitHub

---

## 📂 Project Structure

```
sdk/flutter/
├── 📄 Documentation
│   ├── INDEX.md (this file)      → Navigation guide
│   ├── README.md                 → Complete documentation
│   ├── QUICKSTART.md             → Quick start guide
│   ├── SDK_OVERVIEW.md           → SDK overview
│   ├── ARCHITECTURE.md           → Technical details
│   ├── MIGRATION.md              → Migration guide
│   ├── CONTRIBUTING.md           → Contribution guide
│   ├── VALIDATION.md             → Testing checklist
│   ├── CHANGELOG.md              → Version history
│   └── SUMMARY.md                → Development summary
│
├── 📁 Source Code
│   ├── lib/                      → SDK source code
│   │   ├── core/                 → Core functionality
│   │   ├── services/             → Services layer
│   │   ├── models/               → Data models
│   │   ├── providers/            → State management
│   │   └── ui/                   → UI components
│   │
│   ├── example/                  → Demo application
│   │   ├── lib/main.dart         → Example app
│   │   └── README.md             → Example docs
│   │
│   └── test/                     → Unit tests (TBD)
│
├── ⚙️ Configuration
│   ├── pubspec.yaml              → Dependencies
│   ├── analysis_options.yaml    → Linting rules
│   └── .gitignore                → Git ignore rules
│
└── 🛠️ Tools
    ├── setup.ps1                 → Setup script
    └── LICENSE                   → MIT License
```

---

## 🔍 Quick Reference

### Installation

```bash
# Run setup script
./setup.ps1

# Or manually
flutter pub get
cd example && flutter pub get
```

### Basic Usage

```dart
// Initialize
await SmaRTCClient.initialize(config);

// Login
await SmaRTCClient.instance.auth.login(...);

// Join call
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => CallScreen(sessionId: id),
  ),
);
```

### Key Classes

| Class | Purpose | Documentation |
|-------|---------|---------------|
| `SmaRTCClient` | Main SDK entry point | [README.md](README.md#-api-reference) |
| `AuthService` | Authentication | [README.md](README.md#authservice) |
| `SessionService` | Session management | [README.md](README.md#sessionservice) |
| `WebRTCService` | WebRTC calls | [README.md](README.md#webrtcservice) |
| `CallProvider` | State management | [ARCHITECTURE.md](ARCHITECTURE.md#state-management-provider) |
| `CallScreen` | Call UI | [README.md](README.md#ui-screens) |

---

## 🎓 Learning Path

### Beginner (0-1 hour)
1. ✅ Read [SDK_OVERVIEW.md](SDK_OVERVIEW.md)
2. ✅ Follow [QUICKSTART.md](QUICKSTART.md)
3. ✅ Run the example app
4. ✅ Try basic features (login, join call)

### Intermediate (1-4 hours)
1. ✅ Read full [README.md](README.md)
2. ✅ Integrate in your app
3. ✅ Customize UI colors/theme
4. ✅ Handle errors and edge cases

### Advanced (4+ hours)
1. ✅ Study [ARCHITECTURE.md](ARCHITECTURE.md)
2. ✅ Extend services for custom needs
3. ✅ Implement custom UI components
4. ✅ Contribute to the project

---

## 📞 Support Resources

### Documentation
- 📖 [Complete Docs](README.md)
- 🚀 [Quick Start](QUICKSTART.md)
- 🏗️ [Architecture](ARCHITECTURE.md)

### Code
- 💻 [Source Code](lib/)
- 🎮 [Example App](example/)
- 🧪 [Tests](test/)

### Community
- 🐛 [Report Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)
- 💬 [Discussions](https://github.com/DeLTa-X-Tunisia/SmaRTC/discussions)
- 🤝 [Contribute](CONTRIBUTING.md)

---

## 🎯 Common Tasks

### Setup Tasks
- [ ] Install Flutter SDK
- [ ] Clone repository
- [ ] Run `setup.ps1`
- [ ] Start backend services
- [ ] Run example app

### Development Tasks
- [ ] Add SDK to your app
- [ ] Configure authentication
- [ ] Implement video calling
- [ ] Customize UI
- [ ] Handle permissions

### Testing Tasks
- [ ] Test authentication flow
- [ ] Test single-user call
- [ ] Test multi-user call
- [ ] Test on Android
- [ ] Test on iOS

### Deployment Tasks
- [ ] Update production URLs
- [ ] Configure STUN/TURN
- [ ] Disable debug logging
- [ ] Test on real devices
- [ ] Release to store

---

## 📊 Documentation Metrics

| Metric | Value |
|--------|-------|
| Total Documents | 10+ |
| Total Pages | 50+ |
| Code Examples | 100+ |
| Diagrams | 5+ |
| Screenshots | 3+ |

---

## 🎉 Next Steps

1. **Get Started**: Read [QUICKSTART.md](QUICKSTART.md)
2. **Explore**: Run the [example app](example/)
3. **Integrate**: Follow [README.md](README.md)
4. **Customize**: Check [ARCHITECTURE.md](ARCHITECTURE.md)
5. **Contribute**: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📝 Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| README.md | ✅ Complete | 2025-11-18 |
| QUICKSTART.md | ✅ Complete | 2025-11-18 |
| SDK_OVERVIEW.md | ✅ Complete | 2025-11-18 |
| ARCHITECTURE.md | ✅ Complete | 2025-11-18 |
| MIGRATION.md | ✅ Complete | 2025-11-18 |
| CONTRIBUTING.md | ✅ Complete | 2025-11-18 |
| VALIDATION.md | ✅ Complete | 2025-11-18 |
| CHANGELOG.md | ✅ Complete | 2025-11-18 |
| SUMMARY.md | ✅ Complete | 2025-11-18 |
| INDEX.md | ✅ Complete | 2025-11-18 |

---

## 🙏 Thank You!

Thank you for using SmaRTC Flutter SDK! We hope this documentation helps you build amazing video calling applications.

**Questions?** Check the docs above or reach out via GitHub!

---

<div align="center">

**Made with 💙 by [DeLTa-X-Tunisia](https://github.com/DeLTa-X-Tunisia)**

*Smart Real-Time Communication — Documentation that guides!*

</div>
