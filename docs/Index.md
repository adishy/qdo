# QDO Knowledge Base

Welcome to the QDO development vault. This documentation is intended for both humans and AI agents working on the system.

## Entry Points
- [[Requirements]]: Core user stories and functional specs.
- [[Architecture]]: Technical breakdown of the system components.

## Development Principles
- **Dependency Minimal:** Use native browser APIs (IndexedDB, Notifications) over libraries.
- **Snappy First:** Performance and animation fluidity are top priorities.
- **Local Only:** No backend; the browser is the single source of truth.
- **Composable Data:** The task model is intentionally flat and extensible via `customProperties`.
