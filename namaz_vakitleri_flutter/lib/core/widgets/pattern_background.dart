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

  /// Base opacity of the pattern (default 0.05). Pattern is then masked by a vertical fade.
  final double? opacity;

  static const String _assetLight = 'assets/images/pattern-background-light.png';
  static const String _assetDark = 'assets/images/pattern-background-dark.png';

  static const double _baseOpacity = 0.05;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final asset = isDark ? _assetDark : _assetLight;
    final effectiveOpacity = opacity ?? _baseOpacity;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Bottom: theme scaffold color
        Container(
          color: theme.scaffoldBackgroundColor,
        ),
        // Middle: pattern with 5% opacity and vertical gradient mask (visible at top, fade to 0 by center)
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
        // Top: actual content
        child,
      ],
    );
  }
}
