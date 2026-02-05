import 'dart:async';
import 'package:flutter/material.dart';

/// Hero countdown section: next prayer name and live countdown (h:m:s)
/// with an optional circular progress bar for the current prayer window.
class CountdownTimer extends StatefulWidget {
  const CountdownTimer({
    super.key,
    required this.nextPrayerName,
    this.initialTimeUntilMs,
    this.progress = 0.0,
    this.onReachedZero,
  });

  final String nextPrayerName;
  final int? initialTimeUntilMs;
  final double progress;
  final VoidCallback? onReachedZero;

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer> {
  Timer? _timer;
  int? _remainingMs;

  @override
  void initState() {
    super.initState();
    _remainingMs = widget.initialTimeUntilMs;
    _startTimer();
  }

  @override
  void didUpdateWidget(CountdownTimer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialTimeUntilMs != widget.initialTimeUntilMs) {
      _remainingMs = widget.initialTimeUntilMs;
      _timer?.cancel();
      _startTimer();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    if (_remainingMs == null || _remainingMs! <= 0) {
      widget.onReachedZero?.call();
      return;
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remainingMs == null) return;
      setState(() {
        _remainingMs = _remainingMs! - 1000;
        if (_remainingMs! <= 0) {
          _remainingMs = 0;
          _timer?.cancel();
          widget.onReachedZero?.call();
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  static String _formatDuration(int ms) {
    if (ms <= 0) return '00:00:00';
    final d = Duration(milliseconds: ms);
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final remaining = _remainingMs ?? widget.initialTimeUntilMs ?? 0;
    final textColor = Colors.white;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          widget.nextPrayerName,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: textColor,
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: 160,
          height: 160,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 160,
                height: 160,
                child: CircularProgressIndicator(
                  value: widget.progress.clamp(0.0, 1.0),
                  strokeWidth: 3,
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white70),
                ),
              ),
              Text(
                _formatDuration(remaining),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: textColor,
                      fontWeight: FontWeight.w600,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
