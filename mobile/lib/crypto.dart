import 'package:flutter/services.dart';

class EncryptedPayload {
  final int version;
  final Uint8List salt;
  final Uint8List nonce;
  final Uint8List ciphertext;

  const EncryptedPayload({
    required this.version,
    required this.salt,
    required this.nonce,
    required this.ciphertext,
  });
}

const _channel = MethodChannel('txtshr/crypto');

Future<EncryptedPayload> encrypt(String plaintext, String passphrase) async {
  final result = await _channel.invokeMapMethod<String, dynamic>('encrypt', {
    'plaintext': plaintext,
    'passphrase': passphrase,
  });
  return EncryptedPayload(
    version: 1,
    salt: result!['salt'] as Uint8List,
    nonce: result['nonce'] as Uint8List,
    ciphertext: result['ciphertext'] as Uint8List,
  );
}
