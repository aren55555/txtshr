import 'package:flutter/material.dart';

class StepText extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onChanged;
  final VoidCallback onNext;

  const StepText({
    super.key,
    required this.controller,
    required this.onChanged,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        TextField(
          controller: controller,
          maxLines: 12,
          textAlignVertical: TextAlignVertical.top,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Text to share',
            alignLabelWithHint: true,
            border: OutlineInputBorder(),
          ),
          onChanged: (_) => onChanged(),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: controller.text.isNotEmpty ? onNext : null,
          child: const Text('Next'),
        ),
      ],
    );
  }
}
