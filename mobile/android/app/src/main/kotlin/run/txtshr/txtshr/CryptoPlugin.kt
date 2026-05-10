package run.txtshr.txtshr

// PBKDF2-SHA256 + AES-256-GCM, matching cli/internal/crypto/encrypt.go exactly:
//   salt:       16 bytes (random)
//   nonce:      12 bytes (random)
//   iterations: 600_000
//   key:        32 bytes
//   tag:        16 bytes, appended to ciphertext by Android's AES/GCM/NoPadding

import android.os.Handler
import android.os.Looper
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.security.SecureRandom
import java.util.concurrent.Executors
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

class CryptoPlugin : FlutterPlugin, MethodChannel.MethodCallHandler {
  private lateinit var channel: MethodChannel
  private val executor = Executors.newSingleThreadExecutor()
  private val mainHandler = Handler(Looper.getMainLooper())

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel = MethodChannel(binding.binaryMessenger, "txtshr/crypto")
    channel.setMethodCallHandler(this)
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel.setMethodCallHandler(null)
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    if (call.method != "encrypt") {
      result.notImplemented()
      return
    }
    val plaintext = call.argument<String>("plaintext")
    val passphrase = call.argument<String>("passphrase")
    if (plaintext == null || passphrase == null) {
      result.error("INVALID_ARGS", "plaintext and passphrase are required", null)
      return
    }

    executor.submit {
      try {
        val output = encryptV1(plaintext, passphrase)
        mainHandler.post { result.success(output) }
      } catch (e: Exception) {
        mainHandler.post { result.error("ENCRYPT_FAILED", e.message, null) }
      }
    }
  }

  private fun encryptV1(plaintext: String, passphrase: String): Map<String, ByteArray> {
    val rng = SecureRandom()
    val salt = ByteArray(16).also { rng.nextBytes(it) }
    val nonce = ByteArray(12).also { rng.nextBytes(it) }

    val spec = PBEKeySpec(passphrase.toCharArray(), salt, 600_000, 256)
    val keyBytes = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
    spec.clearPassword()

    // AES/GCM/NoPadding appends the 16-byte tag to the ciphertext automatically
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(keyBytes, "AES"), GCMParameterSpec(128, nonce))
    val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

    return mapOf("salt" to salt, "nonce" to nonce, "ciphertext" to ciphertext)
  }
}
