import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../crypto.dart';
import '../renderer.dart';
import '../share_url.dart';
import 'brand.dart';
import 'result.dart';
import 'step_text.dart';
import 'step_renderer.dart';
import 'step_passphrase.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _step = 0;

  // Step 1
  final _plaintextCtrl = TextEditingController();

  // Step 2
  bool _useRenderer = false;
  final _rendererCtrl = TextEditingController();
  String? _rendererError;

  // Step 3
  final _passphraseCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _requireConfirm = true;
  bool _encrypting = false;

  static const _stepTitles = ['Options', 'Secure it'];

  @override
  void dispose() {
    _plaintextCtrl.dispose();
    _rendererCtrl.dispose();
    _passphraseCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  void _back() => setState(() => _step--);

  void _nextFromText() {
    if (_plaintextCtrl.text.isEmpty) return;
    setState(() => _step = 1);
  }

  void _nextFromRenderer() {
    if (_useRenderer && _rendererCtrl.text.isNotEmpty) {
      if (RendererSpec.parse(_rendererCtrl.text) == null) {
        setState(() => _rendererError = 'Expected owner/repo/name[@version]');
        return;
      }
    }
    setState(() { _rendererError = null; _step = 2; });
  }

  Future<void> _encrypt() async {
    RendererSpec? renderer;
    if (_useRenderer && _rendererCtrl.text.isNotEmpty) {
      renderer = RendererSpec.parse(_rendererCtrl.text);
    }

    setState(() => _encrypting = true);
    try {
      final payload = await encrypt(_plaintextCtrl.text, _passphraseCtrl.text);
      final url = buildUrl(payload, renderer: renderer);
      if (mounted) {
        await showModalBottomSheet<void>(
          context: context,
          isScrollControlled: true,
          builder: (_) => ResultSheet(url: url),
        );
      }
    } on PlatformException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Encryption failed: ${e.message}')),
        );
      }
    } finally {
      if (mounted) setState(() => _encrypting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        appBar: AppBar(
          title: _step == 0
              ? const BrandLogo(fontSize: 48)
              : Text(_stepTitles[_step - 1]),
          leading: _step > 0 ? BackButton(onPressed: _back) : null,
          automaticallyImplyLeading: false,
          actions: [
            if (_step == 0)
              IconButton(
                icon: const Icon(Icons.info_outline),
                tooltip: 'About',
                onPressed: () => showDialog<void>(
                  context: context,
                  builder: (_) => const _InfoDialog(),
                ),
              ),
          ],
        ),
        body: SafeArea(
          child: switch (_step) {
            0 => StepText(
                controller: _plaintextCtrl,
                onChanged: () => setState(() {}),
                onNext: _nextFromText,
              ),
            1 => StepRenderer(
                useRenderer: _useRenderer,
                controller: _rendererCtrl,
                rendererError: _rendererError,
                onUseRendererChanged: (v) => setState(() {
                  _useRenderer = v;
                  if (!v) { _rendererCtrl.clear(); _rendererError = null; }
                }),
                onChanged: () => setState(() {}),
                onNext: _nextFromRenderer,
              ),
            2 => StepPassphrase(
                passphraseCtrl: _passphraseCtrl,
                confirmCtrl: _confirmCtrl,
                requireConfirm: _requireConfirm,
                encrypting: _encrypting,
                onRequireConfirmChanged: (v) => setState(() {
                  _requireConfirm = v;
                  if (!v) _confirmCtrl.clear();
                }),
                onChanged: () => setState(() {}),
                onEncrypt: _encrypt,
              ),
            _ => const SizedBox.shrink(),
          },
        ),
      ),
    );
  }
}

class _InfoDialog extends StatelessWidget {
  const _InfoDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('About'),
      content: const Text(
        'Share encrypted text via a URL. The passphrase never leaves your device — '
        'decryption happens entirely in your browser. Even the server can\'t read your message.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Got it'),
        ),
      ],
    );
  }
}
