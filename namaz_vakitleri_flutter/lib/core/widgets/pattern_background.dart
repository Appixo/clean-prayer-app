import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Reusable background that shows a theme-aware pattern image (light/dark)
/// behind [child]. Pattern is faded via a vertical gradient so it's only
/// visible in the top header area; list/content area stays clean.
class PatternBackground extends StatelessWidget {
  const PatternBackground({
    super.key,
    required this.child,
    this.opacity,
  });

  /// Content drawn on top of the pattern.
  final Widget child;

  /// Override pattern opacity. Pattern is masked by a vertical fade (strong at top, gone by center).
  final double? opacity;

  static const String _assetLight = 'assets/images/pattern-background-light.png';
  static const String _assetDark = 'assets/images/pattern-background-dark.png';

  /// Pattern opacity: light 0.15 (visible under header/date), dark 0.20. Scrim tuned so pattern pops in header area.
  static const double _opacityLight = 0.15;
  static const double _opacityDark = 0.20;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final asset = isDark ? _assetDark : _assetLight;
    final baseOpacity = isDark ? _opacityDark : _opacityLight;
    final effectiveOpacity = opacity ?? baseOpacity;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Bottom: theme scaffold color
        Container(
          color: theme.scaffoldBackgroundColor,
        ),
        // Middle: pattern with theme opacity and vertical gradient mask (visible at top, fade to 0 by center)
        Positioned.fill(
          child: ShaderMask(
            blendMode: BlendMode.dstIn,
            shaderCallback: (Rect bounds) {
              return ui.Gradient.linear(
                Offset(bounds.center.dx, bounds.top),
                Offset(bounds.center.dx, bounds.center.dy),
                [const Color(0xFFFFFFFF), const Color(0x00FFFFFF)],
                [0.0, 1.0],
              );
            },
            child: Opacity(
              opacity: effectiveOpacity,
              child: Container(
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage(asset),
                    repeat: ImageRepeat.repeat,
                  ),
                ),
              ),
            ),
          ),
        ),
        // Top-to-bottom scrim: light mode uses lower top alpha so pattern shows under header/date; fade ends before prayer list.
        Positioned.fill(
          child: IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: isDark
                      ? [
                          theme.scaffoldBackgroundColor.withValues(alpha: 0.35),
                          theme.scaffoldBackgroundColor.withValues(alpha: 0.0),
                        ]
                      : [
                          theme.scaffoldBackgroundColor.withValues(alpha: 0.48),
                          theme.scaffoldBackgroundColor.withValues(alpha: 0.0),
                        ],
                  stops: isDark ? const [0.0, 0.42] : const [0.0, 0.48],
                ),
              ),
            ),
          ),
        ),
        // Top: actual content
        child,
      ],
    );
  }
}
