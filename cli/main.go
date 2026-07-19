package main

import (
	"flag"
	"fmt"
	"io"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/aren55555/txtshr/internal/fragment"
	"github.com/aren55555/txtshr/internal/scheme"
	"golang.org/x/term"
)

var rendererSpecRe = regexp.MustCompile(`^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+(@[a-zA-Z0-9._-]+)?$`)

const defaultViewerURL = "https://txtshr.run/"

var version = "dev"

func main() {
	viewerURLFlag := flag.String("viewer-url", defaultViewerURL, "Base URL of the txtshr viewer")
	text := flag.String("text", "", "Plaintext to encrypt (reads stdin if not provided)")
	password := flag.String("password", "", "Passphrase for encryption (prompts interactively if not provided)")
	versionFlag := flag.Bool("version", false, "Print version and exit")
	insecure := flag.Bool("insecure", false, "Share WITHOUT encryption (v0): anyone with the URL can read the content")
	rendererFlag := flag.String("renderer", "", "Renderer spec (owner/repo/name[@version])")
	flag.StringVar(rendererFlag, "r", "", "Renderer spec (shorthand)")
	flag.Parse()

	if *versionFlag {
		fmt.Println(version)
		os.Exit(0)
	}

	if *rendererFlag != "" && !rendererSpecRe.MatchString(*rendererFlag) {
		fatalf("invalid renderer spec %q: expected owner/repo/name[@version]", *rendererFlag)
	}

	// TXTSHR_VIEWER_URL env var takes precedence over --viewer-url flag.
	viewerURL := *viewerURLFlag
	if envURL := os.Getenv("TXTSHR_VIEWER_URL"); envURL != "" {
		viewerURL = envURL
	}

	// Resolve plaintext: flag > stdin.
	var plaintext []byte
	if *text != "" {
		plaintext = []byte(*text)
	} else {
		// When reading from stdin, print a hint to stderr if stdin is a terminal
		// (i.e. the user ran `txtshr` directly without piping anything in).
		// Without this, the process silently blocks waiting for input, which looks
		// like a hang. The hint goes to stderr so it never pollutes the URL written
		// to stdout. We don't print it when stdin is a pipe because the data is
		// already flowing — the hint would just be noise in a script.
		if term.IsTerminal(int(os.Stdin.Fd())) {
			fmt.Fprintln(os.Stderr, "reading from stdin (^D to finish)...")
		}
		var err error
		plaintext, err = io.ReadAll(os.Stdin)
		if err != nil {
			fatalf("reading stdin: %v", err)
		}
	}
	if len(plaintext) == 0 {
		fatalf("no plaintext provided (use --text or pipe via stdin)")
	}

	// --insecure selects the non-encrypting v0 scheme; the flag is the
	// explicit per-invocation acknowledgement required by SPEC.md §4.0.
	schemeVersion := scheme.Latest
	if *insecure {
		schemeVersion = scheme.V0
	}
	impl := scheme.Registry[schemeVersion]

	var passphrase string
	if impl.Encrypts() {
		// Resolve passphrase: flag > interactive prompt via /dev/tty.
		if *password != "" {
			passphrase = *password
		} else {
			passphrase = promptPassphrase()
		}
		if passphrase == "" {
			fatalf("passphrase cannot be empty")
		}
	} else {
		// Combining --insecure with --password is contradictory, so reject
		// rather than guess intent.
		if *password != "" {
			fatalf("--insecure and --password are mutually exclusive")
		}
		fmt.Fprintln(os.Stderr, "warning: --insecure: content is NOT encrypted; anyone with the URL can read it")
	}

	params, err := impl.Encode(plaintext, passphrase)
	if err != nil {
		fatalf("encoding: %v", err)
	}
	frag := fragment.Encode(schemeVersion, params)

	if *rendererFlag != "" {
		frag += "&r=" + url.QueryEscape(*rendererFlag)
	}

	base := strings.TrimRight(viewerURL, "/")
	fmt.Printf("%s/#%s\n", base, frag)
	fmt.Fprintln(os.Stderr, "note: this URL never expires")
}

// promptPassphrase reads a passphrase from /dev/tty (so stdin can be piped),
// prompting twice and confirming they match.
func promptPassphrase() string {
	tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
	if err != nil {
		fatalf("opening /dev/tty for passphrase prompt: %v", err)
	}
	defer tty.Close()
	fd := int(tty.Fd())

	fmt.Fprint(tty, "Enter passphrase: ")
	pass1, err := term.ReadPassword(fd)
	fmt.Fprintln(tty)
	if err != nil {
		fatalf("reading passphrase: %v", err)
	}

	fmt.Fprint(tty, "Confirm passphrase: ")
	pass2, err := term.ReadPassword(fd)
	fmt.Fprintln(tty)
	if err != nil {
		fatalf("reading passphrase confirmation: %v", err)
	}

	if string(pass1) != string(pass2) {
		fatalf("passphrases do not match")
	}
	return string(pass1)
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "txtshr: "+format+"\n", args...)
	os.Exit(1)
}
