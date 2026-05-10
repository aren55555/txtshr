import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:txtshr/crypto.dart';
import 'package:txtshr/renderer.dart';
import 'package:txtshr/share_url.dart';

// Fixed test payload — same bytes the Go CLI would produce for known inputs.
// Roundtrip correctness is validated by pasting the output URL into txtshr.run.
final _payload = EncryptedPayload(
  version: 1,
  salt: Uint8List.fromList(List.generate(16, (i) => i)),
  nonce: Uint8List.fromList(List.generate(12, (i) => i)),
  ciphertext: Uint8List.fromList(List.generate(32, (i) => i)),
);

void main() {
  group('buildUrl', () {
    test('produces correct v1 fragment structure', () {
      final url = buildUrl(_payload);
      expect(url, startsWith('https://txtshr.run/#'));
      expect(url, contains('v=1'));
      expect(url, contains('s='));
      expect(url, contains('n='));
      expect(url, contains('c='));
    });

    test('appends renderer when provided', () {
      final renderer = RendererSpec.parse('alice/repo/name@1.0.0')!;
      final url = buildUrl(_payload, renderer: renderer);
      expect(url, contains('r='));
      expect(url, contains('alice'));
    });

    test('omits renderer param when not provided', () {
      final url = buildUrl(_payload);
      expect(url, isNot(contains('r=')));
    });

    test('uses no base64 padding in encoded values', () {
      final url = buildUrl(_payload);
      final fragment = url.substring(url.indexOf('#') + 1);
      final params = Uri.splitQueryString(fragment);
      for (final entry in params.entries.where((e) => e.key != 'v')) {
        expect(entry.value, isNot(endsWith('=')),
            reason: '${entry.key} value must not have base64 padding');
      }
    });

    test('throws on unknown version', () {
      final badPayload = EncryptedPayload(
        version: 99,
        salt: _payload.salt,
        nonce: _payload.nonce,
        ciphertext: _payload.ciphertext,
      );
      expect(() => buildUrl(badPayload), throwsUnsupportedError);
    });

    test('respects custom baseUrl', () {
      final url = buildUrl(_payload, baseUrl: 'https://custom.example.com');
      expect(url, startsWith('https://custom.example.com/#'));
    });
  });
}
