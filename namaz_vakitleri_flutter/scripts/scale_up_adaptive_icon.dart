// Run from project root: dart run scripts/scale_up_adaptive_icon.dart
// Scales the mosque in assets/images/adaptive-icon.png so it appears larger (more visible) in the app icon.

import 'dart:io';

import 'package:image/image.dart' as img;

void main() async {
  final projectRoot = Directory.current;
  if (projectRoot.path.endsWith('scripts')) {
    Directory.current = projectRoot.parent;
  }
  final assetPath = 'assets/images/adaptive-icon.png';
  final file = File(assetPath);
  if (!file.existsSync()) {
    print('Error: $assetPath not found. Run from namaz_vakitleri_flutter root.');
    exit(1);
  }

  final bytes = await file.readAsBytes();
  final decoded = img.decodeImage(bytes);
  if (decoded == null) {
    print('Error: Could not decode $assetPath');
    exit(1);
  }

  // Scale factor: 1.4 = mosque appears 40% larger in the frame (less white margin)
  const scale = 1.4;
  final w = decoded.width;
  final h = decoded.height;
  final scaled = img.copyResize(
    decoded,
    width: (w * scale).round(),
    height: (h * scale).round(),
    interpolation: img.Interpolation.cubic,
  );

  // White canvas (same size as original)
  final canvas = img.Image(width: w, height: h);
  img.fill(canvas, color: img.ColorRgba8(255, 255, 255, 255));

  // Center-crop the scaled image onto the canvas so the mosque fills more of the frame
  final srcX = (scaled.width - w) ~/ 2;
  final srcY = (scaled.height - h) ~/ 2;
  img.compositeImage(
    canvas,
    scaled,
    srcX: srcX.clamp(0, scaled.width),
    srcY: srcY.clamp(0, scaled.height),
    srcW: w,
    srcH: h,
    dstX: 0,
    dstY: 0,
    dstW: w,
    dstH: h,
    blend: img.BlendMode.alpha,
  );

  await file.writeAsBytes(img.encodePng(canvas));
  print('Done: $assetPath updated — mosque scaled up by ${(scale * 100).round()}%. Run: dart run flutter_launcher_icons');
}
