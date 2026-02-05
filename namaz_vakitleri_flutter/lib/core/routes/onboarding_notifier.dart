import 'package:flutter/widgets.dart';

/// Holds whether onboarding is complete (user has location).
/// null = not yet known, true = go to home, false = show onboarding.
/// Updated from main when saved locations / location bloc state are known.
class OnboardingNotifier extends ChangeNotifier {
  bool? _completed;

  bool? get completed => _completed;

  void setCompleted(bool value) {
    if (_completed == value) return;
    _completed = value;
    notifyListeners();
  }
}

/// Provides [OnboardingNotifier] to the widget tree (e.g. OnboardingScreen).
class OnboardingNotifierScope extends InheritedWidget {
  const OnboardingNotifierScope({
    super.key,
    required this.notifier,
    required super.child,
  });

  final OnboardingNotifier notifier;

  static OnboardingNotifier? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<OnboardingNotifierScope>()?.notifier;
  }

  @override
  bool updateShouldNotify(OnboardingNotifierScope oldWidget) =>
      oldWidget.notifier != notifier;
}
