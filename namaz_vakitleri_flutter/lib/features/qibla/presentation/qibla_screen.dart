import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:namaz_vakitleri_flutter/core/di/injection.dart';
import 'package:namaz_vakitleri_flutter/domain/repositories/prayer_times_repository.dart';
import 'package:namaz_vakitleri_flutter/features/location/location.dart';

/// Sensor throttle: update target at most every ~10 fps, min 4° change.
const _throttleDegrees = 4.0;
const _throttleMs = 100;

/// Smooth interpolation: how fast display catches up to target (0.15 = ~100ms to settle).
const _lerpFactor = 0.15;

class QiblaScreen extends StatefulWidget {
  const QiblaScreen({super.key});

  @override
  State<QiblaScreen> createState() => _QiblaScreenState();
}

class _QiblaScreenState extends State<QiblaScreen> with SingleTickerProviderStateMixin {
  double? _qiblaDirection;
  final ValueNotifier<double> _headingNotifier = ValueNotifier<double>(0);
  double _targetHeading = 0;
  double _displayHeading = 0;
  double _lastNotifiedHeading = 0;
  DateTime _lastNotifiedTime = DateTime.now();
  bool _isLoading = true;
  bool _firstHeadingReceived = false;
  String? _errorMessage;
  StreamSubscription<CompassEvent>? _compassSubscription;
  late final Ticker _ticker;
  double _lastNotifiedDisplay = 0;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_onTick);
    _ticker.start();
    _initCompass();
  }

  @override
  void dispose() {
    _ticker.dispose();
    _compassSubscription?.cancel();
    _headingNotifier.dispose();
    super.dispose();
  }

  void _onTick(Duration elapsed) {
    if (!mounted) return;
    final diff = ((_targetHeading - _displayHeading) % 360 + 360) % 360;
    final delta = diff > 180 ? diff - 360 : diff;
    if (delta.abs() < 0.3) {
      _displayHeading = _targetHeading;
      _headingNotifier.value = _displayHeading;
      return;
    }
    _displayHeading = (_displayHeading + delta * _lerpFactor + 360) % 360;
    final displayDelta = ((_displayHeading - _lastNotifiedDisplay) % 360 + 360) % 360;
    final minDisplayDelta = displayDelta > 180 ? 360 - displayDelta : displayDelta;
    if (minDisplayDelta.abs() >= 0.8) {
      _lastNotifiedDisplay = _displayHeading;
      _headingNotifier.value = _displayHeading;
    }
  }

  void _onCompassHeading(double heading) {
    final now = DateTime.now();
    final elapsed = now.difference(_lastNotifiedTime).inMilliseconds;
    final delta = ((heading - _lastNotifiedHeading) % 360 + 360) % 360;
    final minDelta = delta > 180 ? 360 - delta : delta;
    if (minDelta >= _throttleDegrees || elapsed >= _throttleMs) {
      _lastNotifiedHeading = heading;
      _lastNotifiedTime = now;
      _targetHeading = heading;
      if (!_firstHeadingReceived) {
        _firstHeadingReceived = true;
        _displayHeading = heading;
        _lastNotifiedDisplay = heading;
        _headingNotifier.value = heading;
      }
    }
  }

  Future<void> _initCompass() async {
    final locationState = context.read<LocationBloc>().state;
    final coordinates = locationState.coordinates;
    if (coordinates == null) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Önce konum seçin. Ayarlardan şehir ekleyin.';
          _isLoading = false;
        });
      }
      return;
    }
    try {
      _qiblaDirection = getIt<PrayerTimesRepository>().getQiblaAngle(coordinates);
      final stream = FlutterCompass.events;
      if (stream != null) {
        _compassSubscription = stream.listen((event) {
          final h = event.heading ?? 0;
          if (mounted) _onCompassHeading(h);
        });
      } else {
        if (mounted) {
          setState(() {
            _errorMessage = 'Bu cihazda pusula kullanılamıyor.';
            _isLoading = false;
          });
        }
        return;
      }
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Konum alınamadı. Lütfen konum izni verin.';
          _isLoading = false;
        });
      }
    }
  }

  /// When LocationBloc gets coordinates (e.g. user selected city in Settings),
  /// clear the "select location" error and re-init compass so the screen updates
  /// without requiring "Tekrar Dene".
  void _onLocationStateChanged(BuildContext context, LocationState locationState) {
    final coordinates = locationState.coordinates;
    if (coordinates != null && _errorMessage != null && mounted) {
      setState(() {
        _errorMessage = null;
        _isLoading = true;
      });
      _initCompass();
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<LocationBloc, LocationState>(
      listener: _onLocationStateChanged,
      child: _buildContent(context),
    );
  }

  Widget _buildContent(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Kıble Yönü'),
          backgroundColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Kıble Yönü'),
          backgroundColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  LucideIcons.mapPinOff,
                  size: 64,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: 16),
                Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () {
                    setState(() {
                      _errorMessage = null;
                      _isLoading = true;
                    });
                    _initCompass();
                  },
                  icon: const Icon(LucideIcons.rotateCcw),
                  label: const Text('Tekrar Dene'),
                  style: FilledButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('Kıble Yönü'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: SafeArea(
        minimum: EdgeInsets.only(top: 24),
        child: ValueListenableBuilder<double>(
            valueListenable: _headingNotifier,
            builder: (context, currentHeading, _) {
              final qiblaOffset = (_qiblaDirection! - currentHeading + 360) % 360;
              final degreesFromQibla = qiblaOffset > 180 ? qiblaOffset - 360 : qiblaOffset;
              final absDeg = degreesFromQibla.abs();
              final isAligned = absDeg < 10 || absDeg > 350;
              final isNearlyAligned = absDeg >= 10 && absDeg <= 20;
              return Column(
                children: [
                  const SizedBox(height: 8),
                  RepaintBoundary(child: _StatusPill(
                    isAligned: isAligned,
                    isNearlyAligned: isNearlyAligned,
                  )),
                  const SizedBox(height: 20),
                  Expanded(
                    child: RepaintBoundary(
                      child: Center(
                        child: _QiblaCompass(
                          size: 260.0,
                          currentHeading: currentHeading,
                          qiblaDirection: _qiblaDirection!,
                          isAligned: isAligned,
                          theme: theme,
                        ),
                      ),
                    ),
                  ),
                  if (!isAligned && degreesFromQibla.abs() > 20) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        'Seccade Kabe\'ye baktığında Kıble yönündesiniz',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          height: 1.3,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  RepaintBoundary(child: _AnglePill(degreesFromQibla: degreesFromQibla, theme: theme)),
                ],
              );
            },
        ),
      ),
    );
  }
}

/// Status pill: verbal state only (no degrees). Angle pill below is the single numeric authority.
class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.isAligned, required this.isNearlyAligned});

  final bool isAligned;
  final bool isNearlyAligned;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    String message;
    IconData icon;
    Color pillColor;
    Color borderColor;
    Color textColor;
    if (isAligned) {
      message = 'Kıble yönündesiniz';
      icon = LucideIcons.checkCircle2;
      pillColor = Colors.green.withOpacity(0.12);
      borderColor = Colors.green.withOpacity(0.5);
      textColor = Colors.green;
    } else if (isNearlyAligned) {
      message = 'Kıbleye çok yaklaştınız';
      icon = LucideIcons.compass;
      pillColor = theme.colorScheme.surfaceContainerHigh.withOpacity(0.8);
      borderColor = Colors.green.withOpacity(0.35);
      textColor = theme.colorScheme.onSurface;
    } else {
      message = 'Kıbleye doğru dönün';
      icon = LucideIcons.compass;
      pillColor = theme.colorScheme.surfaceContainerHigh.withOpacity(0.8);
      borderColor = theme.colorScheme.outline.withOpacity(0.3);
      textColor = theme.colorScheme.onSurface;
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: pillColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: borderColor, width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 22,
              color: isAligned ? Colors.green : theme.colorScheme.primary,
            ),
            const SizedBox(width: 12),
            Text(
              message,
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Asset path for optional compass ring image (add PNG for custom look).
const _kCompassRingAsset = 'assets/images/qibla_compass_ring.png';

class _QiblaCompass extends StatelessWidget {
  const _QiblaCompass({
    required this.size,
    required this.currentHeading,
    required this.qiblaDirection,
    required this.isAligned,
    required this.theme,
  });

  final double size;
  final double currentHeading;
  final double qiblaDirection;
  final bool isAligned;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Compass ring: rotates with device heading. Use image or fallback to painted ring + labels.
        Transform.rotate(
          angle: -currentHeading * math.pi / 180,
          child: SizedBox(
            width: size,
            height: size,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Image.asset(
                  _kCompassRingAsset,
                  width: size,
                  height: size,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => CustomPaint(
                    size: Size(size, size),
                    painter: _CompassRingPainter(colorScheme: theme.colorScheme),
                  ),
                ),
                CustomPaint(
                  size: Size(size, size),
                  painter: _CompassLabelsPainter(colorScheme: theme.colorScheme),
                ),
              ],
            ),
          ),
        ),
        // Qibla arrow: points toward Mecca. Green when aligned, primary otherwise.
        Transform.rotate(
          angle: (qiblaDirection - currentHeading) * math.pi / 180,
          child: CustomPaint(
            size: Size(size * 0.5, size * 0.5),
            painter: _QiblaArrowPainter(
              color: isAligned ? Colors.green : theme.colorScheme.primary,
              isAligned: isAligned,
            ),
          ),
        ),
      ],
    );
  }
}

/// Paints a clean arrow pointing up (toward qibla). Fills with [color]; adds a soft glow when [isAligned].
class _QiblaArrowPainter extends CustomPainter {
  _QiblaArrowPainter({required this.color, required this.isAligned});

  final Color color;
  final bool isAligned;

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final tipY = size.height * 0.08;
    final baseY = size.height * 0.92;
    final halfBase = size.width * 0.22;

    final path = Path()
      ..moveTo(centerX, tipY)
      ..lineTo(centerX - halfBase, baseY)
      ..lineTo(centerX - halfBase * 0.4, baseY)
      ..lineTo(centerX, baseY - size.height * 0.15)
      ..lineTo(centerX + halfBase * 0.4, baseY)
      ..lineTo(centerX + halfBase, baseY)
      ..close();

    if (isAligned) {
      final glowPaint = Paint()
        ..color = color.withOpacity(0.25)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
      canvas.drawPath(path, glowPaint);
    }

    final fillPaint = Paint()..color = color;
    canvas.drawPath(path, fillPaint);

    final strokePaint = Paint()
      ..color = isAligned ? color.withOpacity(0.9) : color.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _QiblaArrowPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.isAligned != isAligned;
}

class _AnglePill extends StatelessWidget {
  const _AnglePill({required this.degreesFromQibla, required this.theme});

  final double degreesFromQibla;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final bottomPad = 28 + MediaQuery.of(context).viewPadding.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 8, 24, bottomPad),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHigh.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.2),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${degreesFromQibla.abs().toStringAsFixed(1)}°',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Kıbleye açı farkı',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CompassRingPainter extends CustomPainter {
  _CompassRingPainter({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final strokePaint = Paint()
      ..color = colorScheme.outline.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawCircle(center, radius, strokePaint);
    canvas.drawCircle(center, radius * 0.7, strokePaint);
    canvas.drawCircle(center, radius * 0.4, strokePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Paints K/D/G/B cardinal labels on top of compass ring (used with image or painted ring).
class _CompassLabelsPainter extends CustomPainter {
  _CompassLabelsPainter({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    const labels = ['K', 'D', 'G', 'B'];
    final labelBgPaint = Paint()
      ..color = colorScheme.surfaceContainerHighest.withOpacity(0.9);
    final labelBorderPaint = Paint()
      ..color = colorScheme.outline.withOpacity(0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (var i = 0; i < 4; i++) {
      final angle = i * math.pi / 2;
      final x = center.dx + (radius * 0.85) * math.sin(angle);
      final y = center.dy - (radius * 0.85) * math.cos(angle);
      final labelCenter = Offset(x, y);
      canvas.drawCircle(labelCenter, 16, labelBgPaint);
      canvas.drawCircle(labelCenter, 16, labelBorderPaint);
      final textPainter = TextPainter(
        text: TextSpan(
          text: labels[i],
          style: TextStyle(
            color: i == 0 ? colorScheme.primary : colorScheme.onSurface,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(x - textPainter.width / 2, y - textPainter.height / 2),
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
