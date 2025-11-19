// Platform-specific exports
// React Native Metro bundler will automatically resolve to .native.ts or .web.tsx based on platform
// For TypeScript/linter compatibility, we export from .native by default
// Metro will handle platform-specific resolution at build time
export * from './index.native';

