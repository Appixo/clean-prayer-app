# Contributing to Namaz Vakitleri

## Where to Put New Code

| Type | Location |
|------|----------|
| New UI screen | `lib/features/<feature>/presentation/` |
| New BLoC | `lib/features/<feature>/presentation/bloc/` |
| New repository | `lib/data/repositories/` + `lib/domain/repositories/` |
| New entity | `lib/domain/entities/` |
| New constant | `lib/core/constants/` (storage_keys vs app_constants) |
| New shared widget | `lib/core/widgets/` or `lib/features/_shared/` |
| New util | `lib/core/utils/` or feature-local if single-use |
| New platform init | `lib/core/platform/` |

## Feature Structure

Features with BLoC use:

```
feature_name/
├── presentation/
│   ├── bloc/
│   │   ├── feature_bloc.dart
│   │   ├── feature_event.dart
│   │   └── feature_state.dart
│   ├── widgets/
│   └── feature_screen.dart
└── feature_name.dart   # Barrel: export public API
```

## Dependency Rules

- **Domain** has no dependencies on data or presentation.
- **Data** depends only on domain.
- **Presentation** may depend on domain and (via DI) repository interfaces.
- **Features must not import other features' presentation.** Use shared Blocs provided at app level, or extract shared logic to domain/core.
