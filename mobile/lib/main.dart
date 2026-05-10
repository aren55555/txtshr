import 'package:flutter/material.dart';
import 'theme.dart';
import 'ui/home.dart';

void main() {
  runApp(const TxtshrApp());
}

class TxtshrApp extends StatelessWidget {
  const TxtshrApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'txtshr',
      theme: txtshrTheme,
      debugShowCheckedModeBanner: false,
      home: const HomeScreen(),
    );
  }
}
