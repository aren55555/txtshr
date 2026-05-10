import 'dart:convert';
import 'dart:typed_data';
import 'crypto.dart';
import 'renderer.dart';

String buildUrl(
  EncryptedPayload payload, {
  RendererSpec? renderer,
  String baseUrl = 'https://txtshr.run',
}) {
  return switch (payload.version) {
    1 => _buildV1(payload, renderer: renderer, baseUrl: baseUrl),
    _ => throw UnsupportedError('unknown payload version: ${payload.version}'),
  };
}

String _buildV1(
  EncryptedPayload payload, {
  required RendererSpec? renderer,
  required String baseUrl,
}) {
  String b64(Uint8List bytes) => base64Url.encode(bytes).replaceAll('=', '');

  var fragment = 'v=1'
      '&s=${b64(payload.salt)}'
      '&n=${b64(payload.nonce)}'
      '&c=${b64(payload.ciphertext)}';

  if (renderer != null) {
    fragment += '&r=${Uri.encodeQueryComponent(renderer.toString())}';
  }

  final base = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
  return '$base/#$fragment';
}
