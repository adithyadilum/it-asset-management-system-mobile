# SDK 57 URI decoder adapter

Expo Router 57 uses query-string 7, which requires a CommonJS decoding function. The patched upstream decoder 0.5.1 is ESM-only. This adapter exports its default function through CommonJS; all decoding is performed by the unmodified patched upstream package, installed as the root alias `decode-uri-component-modern`.

The adapter and npm alias support Node 22+, Metro and Jest without upgrading Expo Router to SDK 58. Route parsing and malformed-input tests run in both Jest and Node. Remove this package, alias and override when a supported Expo Router release consumes the patched decoder directly.
