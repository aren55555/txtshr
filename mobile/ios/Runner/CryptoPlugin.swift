import CommonCrypto
import CryptoKit
import Flutter
import Foundation

// PBKDF2-SHA256 + AES-256-GCM, matching cli/internal/crypto/encrypt.go exactly:
//   salt:       16 bytes (random)
//   nonce:      12 bytes (random)
//   iterations: 600_000
//   key:        32 bytes
//   tag:        16 bytes, appended to ciphertext

@objc class CryptoPlugin: NSObject, FlutterPlugin {
  static func register(with registrar: any FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(name: "txtshr/crypto", binaryMessenger: registrar.messenger())
    registrar.addMethodCallDelegate(CryptoPlugin(), channel: channel)
  }

  func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    guard
      call.method == "encrypt",
      let args = call.arguments as? [String: Any],
      let plaintext = args["plaintext"] as? String,
      let passphrase = args["passphrase"] as? String
    else {
      result(FlutterMethodNotImplemented)
      return
    }

    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let output = try Self.encryptV1(plaintext: plaintext, passphrase: passphrase)
        DispatchQueue.main.async { result(output) }
      } catch {
        DispatchQueue.main.async {
          result(FlutterError(code: "ENCRYPT_FAILED", message: error.localizedDescription, details: nil))
        }
      }
    }
  }

  private static func encryptV1(
    plaintext: String,
    passphrase: String
  ) throws -> [String: FlutterStandardTypedData] {
    let salt = try randomBytes(16)
    let nonce = try randomBytes(12)
    let key = try pbkdf2(passphrase: passphrase, salt: salt, iterations: 600_000, keyLength: 32)

    let symKey = SymmetricKey(data: key)
    let gcmNonce = try AES.GCM.Nonce(data: nonce)
    let sealed = try AES.GCM.seal(Data(plaintext.utf8), using: symKey, nonce: gcmNonce)
    let ciphertext = sealed.ciphertext + sealed.tag  // 16-byte tag appended, matching Go's gcm.Seal

    return [
      "salt": FlutterStandardTypedData(bytes: salt),
      "nonce": FlutterStandardTypedData(bytes: nonce),
      "ciphertext": FlutterStandardTypedData(bytes: ciphertext),
    ]
  }

  private static func randomBytes(_ count: Int) throws -> Data {
    var data = Data(count: count)
    let status = data.withUnsafeMutableBytes {
      SecRandomCopyBytes(kSecRandomDefault, count, $0.baseAddress!)
    }
    guard status == errSecSuccess else { throw CryptoPluginError.randomFailed }
    return data
  }

  private static func pbkdf2(
    passphrase: String,
    salt: Data,
    iterations: UInt32,
    keyLength: Int
  ) throws -> Data {
    var key = Data(count: keyLength)
    let passData = Data(passphrase.utf8)
    let status: Int32 = key.withUnsafeMutableBytes { keyPtr in
      salt.withUnsafeBytes { saltPtr in
        passData.withUnsafeBytes { passPtr in
          CCKeyDerivationPBKDF(
            CCPBKDFAlgorithm(kCCPBKDF2),
            passPtr.baseAddress, passData.count,
            saltPtr.baseAddress, salt.count,
            CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
            iterations,
            keyPtr.baseAddress, keyLength
          )
        }
      }
    }
    guard status == kCCSuccess else { throw CryptoPluginError.pbkdf2Failed(status) }
    return key
  }
}

private enum CryptoPluginError: Error {
  case randomFailed
  case pbkdf2Failed(Int32)
}
