# Webokit

**A modular, self-hosted PlayStation WebKit entry point.** Webokit combines a console-friendly launcher, firmware/environment diagnostics, offline-capable frontend assets, and a pinned Wobkot exploit-engine dependency.

> **Status:** foundation / integration preview. The launcher and local host are implemented; the upstream Wobkot engine is pinned as a Git submodule. Actual exploit success, firmware coverage, payload compatibility, and stability must be validated on the target PS5. This repository does not claim a tested jailbreak.

## What is included

- A lightweight interface designed for the PS5 browser and desktop development.
- PlayStation user-agent and firmware-version detection (diagnostic only).
- An explicit launch path to the upstream Wobkot engine; no exploit is silently triggered on page load.
- Local HTTP development hosting and HTTPS hosting for console testing.
- A service worker that caches the Webokit shell and same-origin static resources where supported.
- A pinned Wobkot submodule, so upstream exploit code and its MIT license remain intact.
- A minimal Node test suite and GitHub Actions checks.

## Architecture

```text
Webokit/
├── assets/
│   ├── css/webokit.css
│   └── js/webokit.js
├── config/
├── engine/
│   └── wobkot/                 # pinned upstream Git submodule
├── payloads/
├── src/core/firmware.js        # user-agent / firmware parsing
├── tests/
├── tools/generate-cert.py
├── host.py                    # local static HTTP(S) host
├── service-worker.js
└── index.html
```

### Why Wobkot is a submodule

Wobkot is the exploit implementation. It contains its own WebKit primitives, userland setup, PS5 kernel path, and firmware-specific offsets. Keeping it as a pinned submodule avoids silently forking or rewriting sensitive exploit internals and makes upstream updates reviewable.

The Webokit launcher does not pretend that Wobkot and the PS5 WebKit Autoloader expose the same runtime API. The autoloader is an architectural reference for a standalone/offline launcher and payload workflow; its GPL-3.0 code is not copied into this repository.

## Requirements

- Git with submodule support.
- Python 3.10+ (standard library only).
- OpenSSL available on PATH for generating a local HTTPS certificate.
- Node.js 20+ only for running the optional tests.
- A PS5 browser environment compatible with the selected upstream Wobkot revision.
- The exact payload files required by Wobkot for the target firmware. These are intentionally not included.

## Clone

Clone with the submodule:

```bash
git clone --recurse-submodules https://github.com/Trexxxo/Webokit.git
cd Webokit
```

If you already cloned without submodules:

```bash
git submodule update --init --recursive
```

## Prepare Wobkot's PS5 payloads

Wobkot's current PS5 implementation fetches these paths relative to its own root:

- `engine/wobkot/src/ps5/kexp.bin`
- `engine/wobkot/src/ps5/elfldr.elf`

Obtain compatible files from their respective maintainers and place them at those exact paths. Do not commit proprietary, unverified, or firmware-mismatched payload binaries. The launcher checks for their presence and reports missing files; it does not manufacture or substitute payloads.

The upstream Wobkot README describes a different legacy folder layout in its setup notes, while the checked-in PS5 implementation currently requests `src/ps5/kexp.bin` and `src/ps5/elfldr.elf`. Follow the implementation paths above for this pinned revision.

## Run a local host

### HTTP development mode

```bash
python host.py --bind 0.0.0.0 --port 8080
```

Open `http://127.0.0.1:8080` on your development machine.

### HTTPS mode for console testing

Generate a local certificate:

```bash
python tools/generate-cert.py
```

Then start the HTTPS server:

```bash
python host.py --bind 0.0.0.0 --port 8443 --tls-cert .certs/webokit.crt --tls-key .certs/webokit.key
```

Find your computer's LAN IPv4 address and open:

```text
https://YOUR-LAN-IP:8443/
```

A locally generated certificate is self-signed. The PS5 browser may show a certificate warning; only proceed if you are connecting to your own machine and understand the trust implications. Do not expose this development server to the public internet.

Port 443 can be used if your operating system permits binding to it. The default example uses 8443 to avoid requiring elevated privileges.

## Firmware detection and compatibility

Webokit reads the PlayStation browser user-agent and displays the reported platform/version. This is **not** a compatibility verdict. The actual supported firmware range is determined by the pinned Wobkot implementation, its offset tables, required payloads, and the target console environment. A displayed firmware version must never be interpreted as proof that exploitation will work.

The launcher intentionally does not hard-code a broad “supported” badge. Confirm the exact firmware and revision against Wobkot's upstream notes and test on the intended hardware.

## Offline behavior

The service worker caches the Webokit shell and successful same-origin static GET responses when the browser supports service workers. First visit requires a network connection to the host. The exploit engine and payload binaries must be present on the host before they can be cached. Browser cache eviction, private browsing, and PS5 firmware differences can affect persistence.

## Tests

```bash
npm test
```

The tests cover firmware parsing and platform detection only. They do not execute exploit code or certify console compatibility.

## Safety and recovery

- Use only on hardware you own or are authorized to test.
- Back up important data and understand the risks of kernel-level experimentation.
- Do not repeatedly retry a failing exploit on a console that is unstable or overheating.
- Keep payloads matched to the exact firmware and engine revision.
- A browser tab closing, freezing, or returning to the launcher does not prove success or failure; verify using trusted, non-destructive diagnostics.

## Upstream projects

- [Wobkot](https://github.com/ufm42/wobkot) — exploit engine, included as a pinned MIT-licensed submodule.
- [PS5 WebKit Autoloader](https://github.com/itsPLK/ps5-webkit-autoloader) — architectural reference for standalone hosting, caching, and autoloading. No GPL-3.0 source is copied here.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution and license notes.
