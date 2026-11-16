# Local payload assets

Wobkot's pinned PS5 implementation requests the following files from its own root:

- `engine/wobkot/src/ps5/kexp.bin`
- `engine/wobkot/src/ps5/elfldr.elf`

Place only files obtained from trusted upstream maintainers and verified for the exact target firmware and Wobkot revision. These binary assets are ignored by the outer repository's `.gitignore` and must not be committed by default.

The Webokit dashboard checks for file presence only. It cannot verify authenticity, firmware match, or whether a payload is safe to execute.
