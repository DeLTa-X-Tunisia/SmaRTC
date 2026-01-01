# 🤝 Contributing to SmaRTC Flutter SDK

Thank you for considering contributing to the SmaRTC Flutter SDK! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- 🐛 **Report bugs** - Found a bug? Open an issue!
- 💡 **Suggest features** - Have an idea? We'd love to hear it!
- 📝 **Improve documentation** - Help make the docs better
- 🔧 **Submit code** - Fix bugs or add features via pull requests
- 🧪 **Write tests** - Help improve code coverage
- 🌐 **Translate** - Help make the SDK multilingual

## 🚀 Getting Started

### Prerequisites

- Flutter SDK 3.10.0+
- Dart 3.0.0+
- Git
- A code editor (VS Code, Android Studio, etc.)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/SmaRTC.git
   cd SmaRTC/sdk/flutter
   ```

3. **Install dependencies**
   ```bash
   flutter pub get
   cd example
   flutter pub get
   cd ..
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```

## 📝 Code Guidelines

### Dart Style Guide

Follow the official [Dart Style Guide](https://dart.dev/guides/language/effective-dart/style).

```dart
// Good ✅
class MyClass {
  final String name;
  
  MyClass({required this.name});
  
  void doSomething() {
    print('Doing something');
  }
}

// Bad ❌
class my_class {
  String Name;
  my_class(this.Name);
  void DoSomething() { print("Doing something"); }
}
```

### File Naming

- Use `snake_case` for file names: `auth_service.dart`
- Use `PascalCase` for class names: `AuthService`
- Use `camelCase` for variables: `userName`

### Code Organization

```dart
// 1. Imports
import 'package:flutter/material.dart';
import '../models/user.dart';

// 2. Constants
const kDefaultTimeout = Duration(seconds: 30);

// 3. Main class
class MyWidget extends StatelessWidget {
  // 4. Fields
  final String title;
  
  // 5. Constructor
  const MyWidget({Key? key, required this.title}) : super(key: key);
  
  // 6. Build method
  @override
  Widget build(BuildContext context) {
    return Container();
  }
  
  // 7. Other methods
  void _handleTap() {}
}
```

### Documentation

Use dartdoc comments for public APIs:

```dart
/// Authenticates a user with the backend.
///
/// Returns a [Future] that completes when login is successful.
/// Throws an [Exception] if authentication fails.
///
/// Example:
/// ```dart
/// await authService.login(
///   username: 'john_doe',
///   password: 'securePassword',
/// );
/// ```
Future<void> login({
  required String username,
  required String password,
}) async {
  // Implementation
}
```

## 🧪 Testing

### Writing Tests

Create tests in the `test/` directory:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:smartc_sdk/smartc_sdk.dart';

void main() {
  group('AuthService', () {
    test('login should store token on success', () async {
      // Arrange
      final authService = AuthService(config);
      
      // Act
      await authService.login(
        username: 'test',
        password: 'password',
      );
      
      // Assert
      expect(authService.isAuthenticated, true);
    });
  });
}
```

### Running Tests

```bash
flutter test
```

## 🔍 Code Review Process

1. **Self-review** - Review your own code first
2. **Tests** - Ensure all tests pass
3. **Linting** - Run `flutter analyze`
4. **Format** - Run `dart format .`
5. **Submit PR** - Create a pull request

## 📬 Submitting Changes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add chat message support
fix: resolve SignalR disconnection issue
docs: update README with new examples
style: format code with dart format
refactor: simplify WebRTC connection logic
test: add tests for AuthService
chore: update dependencies
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Example app tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
```

## 🐛 Reporting Bugs

Use the issue template:

```markdown
**Bug Description**
Clear and concise description

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- Flutter version: [e.g., 3.16.0]
- Dart version: [e.g., 3.2.0]
- Platform: [e.g., Android 14]
- Device: [e.g., Pixel 7]

**Additional Context**
Any other information
```

## 💡 Feature Requests

Use the feature request template:

```markdown
**Feature Description**
Clear description of the feature

**Problem it Solves**
What problem does this solve?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Mockups, examples, etc.
```

## 📚 Documentation

### Adding Documentation

- Update `README.md` for user-facing changes
- Update `ARCHITECTURE.md` for architectural changes
- Add code examples
- Update `CHANGELOG.md`

### Documentation Style

- Use clear, concise language
- Include code examples
- Add emojis for visual appeal (sparingly)
- Use proper Markdown formatting

## 🎨 UI/UX Contributions

### Design Guidelines

- Follow Material Design principles
- Ensure accessibility (a11y)
- Support light and dark themes
- Responsive design for all screen sizes
- Smooth animations (60 FPS)

### Before Submitting UI Changes

- Test on multiple devices
- Test with different screen sizes
- Test in light and dark mode
- Consider accessibility

## 🌐 Internationalization

### Adding Translations

1. Add new locale files in `lib/l10n/`
2. Update `pubspec.yaml`
3. Generate translation files
4. Test with different locales

## 🔒 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Email: security@deltax-tunisia.com (example)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Public or private harassment
- Publishing private information
- Unprofessional conduct

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Forever appreciated! 💙

## 💬 Questions?

- 💬 [Discussions](https://github.com/DeLTa-X-Tunisia/SmaRTC/discussions)
- 📧 Email: contact@deltax-tunisia.com (example)
- 🐛 [Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to SmaRTC! 🎉**

*Your contribution makes a difference!*
