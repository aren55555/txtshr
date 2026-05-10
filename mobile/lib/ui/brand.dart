import 'package:flutter/material.dart';
import '../theme.dart';

class BrandLogo extends StatelessWidget {
  final double fontSize;

  const BrandLogo({super.key, this.fontSize = 20});

  @override
  Widget build(BuildContext context) {
    return Text(
      'txtshr',
      style: TextStyle(
        fontFamily: 'Bytesized',
        fontSize: fontSize,
        color: emerald400,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
      ),
    );
  }
}
