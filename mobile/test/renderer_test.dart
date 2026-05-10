import 'package:flutter_test/flutter_test.dart';
import 'package:txtshr/renderer.dart';

void main() {
  group('RendererSpec.parse', () {
    test('parses owner/repo/name without version', () {
      final spec = RendererSpec.parse('alice/my-repo/markdown');
      expect(spec, isNotNull);
      expect(spec!.owner, 'alice');
      expect(spec.repo, 'my-repo');
      expect(spec.name, 'markdown');
      expect(spec.version, 'latest');
    });

    test('parses owner/repo/name@version', () {
      final spec = RendererSpec.parse('alice/my-repo/markdown@1.2.3');
      expect(spec, isNotNull);
      expect(spec!.version, '1.2.3');
    });

    test('returns null for too few segments', () {
      expect(RendererSpec.parse('alice/my-repo'), isNull);
    });

    test('returns null for too many segments', () {
      expect(RendererSpec.parse('alice/my-repo/name/extra'), isNull);
    });

    test('returns null for unsafe characters in segment', () {
      expect(RendererSpec.parse('ali ce/repo/name'), isNull);
      expect(RendererSpec.parse('alice/repo/na/me'), isNull);
      expect(RendererSpec.parse('alice/repo/name@bad version'), isNull);
    });

    test('returns null for empty string', () {
      expect(RendererSpec.parse(''), isNull);
    });
  });

  group('RendererSpec.toString', () {
    test('omits version when latest', () {
      final spec = RendererSpec.parse('alice/repo/name');
      expect(spec.toString(), 'alice/repo/name');
    });

    test('includes version when not latest', () {
      final spec = RendererSpec.parse('alice/repo/name@2.0.0');
      expect(spec.toString(), 'alice/repo/name@2.0.0');
    });
  });
}
