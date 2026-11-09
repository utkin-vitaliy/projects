# Walkie

Walkie is a browser-only proof of concept for two people to exchange live audio with WebRTC. A host and guest exchange QR frames containing a short-lived offer or answer; there are no accounts, recordings, server-side signaling, or persisted pairing data.

## Run locally

Serve the folder over HTTPS or `localhost` (microphone/camera APIs require a secure context):

```sh
python3 -m http.server 5177
```

Run protocol checks with Node 22:

```sh
node --test protocol.test.js
```

## Publish

The repository Pages workflow copies this folder to `/projects/walkie-talkie/`. All local asset paths are relative for that subpath. The app provides a favicon, Apple touch icon, Android manifest/icons and a localized feedback link.

## Limits

The app works only if the two networks permit direct WebRTC connectivity. It uses public STUN discovery but has no TURN relay or signaling service, so corporate, symmetric-NAT and some mobile networks can fail. Live scanning uses `BarcodeDetector`; a locally bundled `jsQR` fallback can decode a selected QR screenshot, and a frame can also be pasted manually. The QR encoder is loaded from the pinned `qrcode@1.5.4` jsDelivr ESM URL, so QR display requires that CDN on first load. This is not an emergency, dispatch, or secure identity-verified service.
