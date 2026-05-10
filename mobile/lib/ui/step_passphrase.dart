import 'package:flutter/material.dart';

class StepPassphrase extends StatelessWidget {
  final TextEditingController passphraseCtrl;
  final TextEditingController confirmCtrl;
  final bool requireConfirm;
  final bool encrypting;
  final ValueChanged<bool> onRequireConfirmChanged;
  final VoidCallback onChanged;
  final VoidCallback onEncrypt;

  const StepPassphrase({
    super.key,
    required this.passphraseCtrl,
    required this.confirmCtrl,
    required this.requireConfirm,
    required this.encrypting,
    required this.onRequireConfirmChanged,
    required this.onChanged,
    required this.onEncrypt,
  });

  bool get _mismatch =>
      requireConfirm &&
      confirmCtrl.text.isNotEmpty &&
      confirmCtrl.text != passphraseCtrl.text;

  bool get _canEncrypt =>
      passphraseCtrl.text.isNotEmpty &&
      (!requireConfirm || passphraseCtrl.text == confirmCtrl.text) &&
      !encrypting;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        TextField(
          controller: passphraseCtrl,
          obscureText: true,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Passphrase',
            border: OutlineInputBorder(),
          ),
          onChanged: (_) => onChanged(),
        ),
        if (requireConfirm) ...[
          const SizedBox(height: 16),
          TextField(
            controller: confirmCtrl,
            obscureText: true,
            decoration: InputDecoration(
              labelText: 'Confirm passphrase',
              border: const OutlineInputBorder(),
              errorText: _mismatch ? 'Passphrases do not match' : null,
            ),
            onChanged: (_) => onChanged(),
          ),
        ],
        const SizedBox(height: 8),
        SwitchListTile(
          value: requireConfirm,
          onChanged: onRequireConfirmChanged,
          title: const Text('Confirm passphrase'),
          subtitle: const Text('Enter twice to guard against typos'),
          contentPadding: EdgeInsets.zero,
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _canEncrypt ? onEncrypt : null,
          child: encrypting
              ? const SizedBox.square(
                  dimension: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Generate link'),
        ),
      ],
    );
  }
}
