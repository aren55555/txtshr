package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/aren55555/txtshr/internal/crypto"
	"golang.org/x/term"
)

const defaultViewerURL = "https://txtshr.run/"

func main() {
	viewerURLFlag := flag.String("viewer-url", defaultViewerURL, "Base URL of the txtshr viewer")
	text := flag.String("text", "", "Plaintext to encrypt (reads stdin if not provided)")
	password := flag.String("password", "", "Passphrase for encryption (prompts interactively if not provided)")
	flag.Parse()

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

	// Resolve passphrase: flag > interactive prompt via /dev/tty.
	var passphrase string
	if *password != "" {
		passphrase = *password
	} else {
		passphrase = promptPassphrase()
	}
	if passphrase == "" {
		fatalf("passphrase cannot be empty")
	}

	fragment, err := crypto.Encrypt(plaintext, passphrase)
	if err != nil {
		fatalf("encrypting: %v", err)
	}

	base := strings.TrimRight(viewerURL, "/")
	fmt.Printf("%s/#%s\n", base, fragment)
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
