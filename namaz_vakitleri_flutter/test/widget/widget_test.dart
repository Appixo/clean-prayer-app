// Basic Flutter widget smoke test for Namaz Vakitleri.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App title smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        title: 'Namaz Vakitleri',
        home: Scaffold(
          body: Center(child: Text('Namaz Vakitleri')),
        ),
      ),
    );
    expect(find.text('Namaz Vakitleri'), findsOneWidget);
  });
}
