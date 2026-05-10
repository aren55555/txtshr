import 'package:flutter/material.dart';

// Palette mirrors txtshr.run — Tailwind slate (backgrounds) + emerald (accent).
const slate950 = Color(0xFF020617);
const slate900 = Color(0xFF0F172A);
const slate800 = Color(0xFF1E293B);
const slate700 = Color(0xFF334155);
const slate500 = Color(0xFF64748B);
const slate400 = Color(0xFF94A3B8);
const slate100 = Color(0xFFF1F5F9);

const emerald400 = Color(0xFF34D399);
const emerald500 = Color(0xFF10B981);
const emerald600 = Color(0xFF059669);
const emerald700 = Color(0xFF047857);

final txtshrTheme = ThemeData(
  brightness: Brightness.dark,
  useMaterial3: true,
  colorScheme: const ColorScheme.dark(
    primary: emerald600,
    onPrimary: Colors.white,
    primaryContainer: emerald700,
    onPrimaryContainer: emerald400,
    secondary: emerald400,
    onSecondary: slate950,
    surface: slate950,
    surfaceContainer: slate900,
    surfaceContainerHigh: slate800,
    surfaceContainerHighest: slate700,
    onSurface: slate100,
    onSurfaceVariant: slate400,
    outline: slate700,
    outlineVariant: slate800,
  ),
  scaffoldBackgroundColor: slate950,
  appBarTheme: const AppBarTheme(
    backgroundColor: slate950,
    foregroundColor: slate100,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    titleTextStyle: TextStyle(
      color: emerald400,
      fontSize: 20,
      fontWeight: FontWeight.bold,
      letterSpacing: -0.5,
    ),
  ),
  bottomSheetTheme: const BottomSheetThemeData(
    backgroundColor: slate900,
    surfaceTintColor: Colors.transparent,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
  ),
  inputDecorationTheme: const InputDecorationTheme(
    filled: true,
    fillColor: slate800,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(8)),
      borderSide: BorderSide(color: slate700),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(8)),
      borderSide: BorderSide(color: slate700),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(8)),
      borderSide: BorderSide(color: emerald500, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(8)),
      borderSide: BorderSide(color: Color(0xFFF87171)),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(8)),
      borderSide: BorderSide(color: Color(0xFFF87171), width: 2),
    ),
    labelStyle: TextStyle(color: slate400),
    hintStyle: TextStyle(color: slate500),
    floatingLabelStyle: TextStyle(color: emerald400),
  ),
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((s) =>
        s.contains(WidgetState.selected) ? emerald500 : slate500),
    trackColor: WidgetStateProperty.resolveWith((s) =>
        s.contains(WidgetState.selected) ? emerald700 : slate800),
    trackOutlineColor: WidgetStateProperty.resolveWith((s) =>
        s.contains(WidgetState.selected) ? Colors.transparent : slate700),
  ),
  dialogTheme: const DialogThemeData(
    backgroundColor: slate900,
    surfaceTintColor: Colors.transparent,
    titleTextStyle: TextStyle(color: slate100, fontSize: 18, fontWeight: FontWeight.w600),
    contentTextStyle: TextStyle(color: slate400, fontSize: 15, height: 1.5),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: ButtonStyle(
      backgroundColor: WidgetStateProperty.resolveWith((s) {
        if (s.contains(WidgetState.disabled)) return slate800;
        if (s.contains(WidgetState.pressed)) return emerald700;
        return emerald600;
      }),
      foregroundColor: WidgetStateProperty.resolveWith((s) =>
          s.contains(WidgetState.disabled) ? slate500 : Colors.white),
      shape: WidgetStateProperty.all(
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      padding: WidgetStateProperty.all(
        const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
      ),
    ),
  ),
);
