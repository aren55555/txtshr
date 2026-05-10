import 'package:flutter/material.dart';
import '../theme.dart';

class StepRenderer extends StatelessWidget {
  final bool useRenderer;
  final TextEditingController controller;
  final String? rendererError;
  final ValueChanged<bool> onUseRendererChanged;
  final VoidCallback onChanged;
  final VoidCallback onNext;

  const StepRenderer({
    super.key,
    required this.useRenderer,
    required this.controller,
    required this.rendererError,
    required this.onUseRendererChanged,
    required this.onChanged,
    required this.onNext,
  });

  bool get _anyOptionEnabled => useRenderer;
  bool get _canNext => !useRenderer || controller.text.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'All options are optional.',
          style: TextStyle(color: slate400, fontSize: 13),
        ),
        const SizedBox(height: 20),
        SwitchListTile(
          value: useRenderer,
          onChanged: onUseRendererChanged,
          title: const Text('Use renderer'),
          subtitle: const Text('Apply custom rendering to the shared text'),
          contentPadding: EdgeInsets.zero,
        ),
        if (useRenderer) ...[
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            decoration: InputDecoration(
              labelText: 'Renderer spec',
              hintText: 'owner/repo/name[@version]',
              border: const OutlineInputBorder(),
              errorText: rendererError,
            ),
            onChanged: (_) => onChanged(),
          ),
        ],
        const SizedBox(height: 24),
        FilledButton(
          onPressed: _canNext ? onNext : null,
          child: Text(_anyOptionEnabled ? 'Next' : 'Skip'),
        ),
      ],
    );
  }
}
