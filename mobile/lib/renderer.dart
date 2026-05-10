class RendererSpec {
  final String owner;
  final String repo;
  final String name;
  final String version;

  const RendererSpec._({
    required this.owner,
    required this.repo,
    required this.name,
    required this.version,
  });

  static final _segment = RegExp(r'^[a-zA-Z0-9._-]+$');

  /// Parses `owner/repo/name[@version]`. Returns null on invalid input.
  /// Version defaults to "latest" when omitted.
  static RendererSpec? parse(String raw) {
    final atIdx = raw.indexOf('@');
    final specPart = atIdx == -1 ? raw : raw.substring(0, atIdx);
    final version = atIdx == -1 ? 'latest' : raw.substring(atIdx + 1);

    final parts = specPart.split('/');
    if (parts.length != 3) return null;

    final owner = parts[0];
    final repo = parts[1];
    final name = parts[2];

    if (!_segment.hasMatch(owner)) return null;
    if (!_segment.hasMatch(repo)) return null;
    if (!_segment.hasMatch(name)) return null;
    if (!_segment.hasMatch(version)) return null;

    return RendererSpec._(owner: owner, repo: repo, name: name, version: version);
  }

  /// Returns `owner/repo/name` or `owner/repo/name@version` (omits version when "latest").
  @override
  String toString() {
    final v = version != 'latest' ? '@$version' : '';
    return '$owner/$repo/$name$v';
  }
}
