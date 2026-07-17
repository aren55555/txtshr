# txtshr (mobile)

Flutter client for **txtshr** — the zero-knowledge text-sharing app. Encryption/
decryption happens on-device; the crypto scheme mirrors the CLI and web viewer
(PBKDF2-SHA256 + AES-256-GCM, secrets live in the URL fragment).

- Package / application ID: `run.txtshr.txtshr`
- Flutter toolchain is pinned via [`mise`](mise.toml) (`flutter = 3.41.7`).

## Develop

```bash
mise exec -- flutter pub get     # fetch dependencies
mise exec -- flutter run         # run on a connected device/emulator
mise exec -- flutter test        # run tests
```

## Build a release bundle

Brand assets (app icon, adaptive icon, launch screen) are generated — always
regenerate them first so the build picks up any brand changes:

```bash
just brand::rebuild                                   # from repo root
mise exec -- flutter build appbundle --release        # from mobile/
```

Output: `build/app/outputs/bundle/release/app-release.aab`.

- The release is signed with the keystore referenced by `android/key.properties`
  (not committed). Google re-signs with the app signing key (Play App Signing);
  our keystore is the **upload** key.
- A non-fatal warning — *"Release app bundle failed to strip debug symbols from
  native libraries"* — is expected; the bundle is still valid to upload. It only
  means native debug symbols are retained (no NDK `llvm-strip` configured).

### Versioning

`version:` in [`pubspec.yaml`](pubspec.yaml) is `name+code`, e.g. `1.0.2+5`:

- **build code** (`+5`) → Android `versionCode`. **Must strictly increase** on
  every upload; Play rejects a code ≤ one already uploaded. Codes need not be
  contiguous.
- **build name** (`1.0.2`) → the user-visible `versionName`.

Bump both (name for user-facing changes, code always) before each release build.

## Play Store submission

The app ships through Google Play Console tracks. Managed publishing is **off**,
so approved changes roll out automatically once review passes.

### Tracks

| Track | Review? | Goes live |
|---|---|---|
| **Internal testing** | none | within minutes of publishing |
| **Closed testing** (`Alpha`) | Google review | auto-publishes when review clears |
| **Production** | Google review | public release |

Start on **Internal testing** to sanity-check a build on-device, then promote to
Closed, then Production.

### Upload a build to a track

1. Play Console → **Test and release → Testing → \<track\>** → **Create new
   release** (or **Edit release** if a draft exists).
2. Under **App bundles**, **Upload** `app-release.aab` (or drag it in). Wait for
   it to process; it appears as `N (x.y.z)`.
3. Confirm the **Previous release** section shows the old bundle under *Not
   included* so the release ships only the new build.
4. **Release name** auto-fills as `N (x.y.z)`. Fill **Release notes** inside the
   language tags, e.g.:
   ```
   <en-US>
   Fixes the Android app icon. No functional changes.
   </en-US>
   ```
5. **Next** → **Preview and confirm**, then:
   - **Internal testing:** **Save and publish** → publishes immediately.
   - **Closed / Production:** **Save** → the change lands in **Publishing
     overview** as pending.

### Promote instead of re-uploading

To move an existing build between tracks, open its release and use **Promote
release → \<target track\>**. The bundle *and* release notes carry over — no
re-upload needed.

### Send closed/production changes for review

1. **Publishing overview** → **Submit N changes for review** → **Send changes
   for review**.
2. Play runs **quick checks** (a progress bar, up to ~14 min). When they pass,
   the change moves to **"in review"**.
3. Google review typically completes within a few days (often hours). Because
   managed publishing is off, it **auto-publishes** to the track when approved.
4. To cancel before it publishes: **Publishing overview → Remove changes**.

## Testers

- **Internal testing** uses **email lists** (Testers tab → *Create email list*).
  A Google Group address can be added as a single entry.
- **Closed testing** uses the native **Google Groups** option, pointed at
  `txtshr-testers@googlegroups.com`. Every group member becomes a tester; new
  members are picked up automatically.
- Testers must **opt in** via the track's web opt-in link (Testers tab → *Copy
  link*) with the same Google account, then install from Play — group membership
  alone isn't enough.
- If a group tester hits *"you're not a tester"*, check the group's
  **Who can view members** visibility.

## Production access (first launch)

New personal developer accounts must complete a closed-testing run — **≥12
testers opted in for 14 continuous days** — before Production unlocks. Meeting the
raw numbers isn't sufficient: Google also expects **genuine tester engagement**
(real usage, not just installs) and **iteration** (shipping updates in response
to feedback). Ship updates during the window and drive engagement, then re-apply.
