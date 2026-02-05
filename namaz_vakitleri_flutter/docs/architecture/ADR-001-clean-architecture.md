# ADR-001: Clean Architecture

## Status

Accepted

## Context

The app needs a maintainable, testable structure that scales with feature growth and supports multiple platforms.

## Decision

We use Clean Architecture with three layers:

- **Domain**: Entities, repository interfaces, use cases. No external dependencies.
- **Data**: Repository implementations, datasources, models. Depends only on domain.
- **Presentation**: BLoC, screens, widgets. Depends on domain and (via DI) repositories.

## Consequences

- Clear dependency direction (presentation → domain ← data).
- Business logic is testable without Flutter.
- Features can be developed independently.
