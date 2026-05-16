# Changelog

## [2026-05-16]
- Initialized AI Continuity System in `AI_CONTEXT/`.
- Installed `react-native-get-sms-android`.
- Created `src/constants/sms.ts` for SMS-related constants and types.
- Created `src/types/react-native-get-sms-android.d.ts` for library type safety.
- Overwrote `src/app/index.tsx` with full SMS POC implementation.
- Added SMS permission request logic.
- Added SMS reading logic for the latest 20 messages.
- Added bank filtering logic (SBI, HDFC, ICICI, etc.).
- Designed a clean, minimal UI with permission status and loading states.
- Expanded `BANK_KEYWORDS` to include more transaction-related terms (DEBITED, CREDITED, etc.).
- Replaced broken and outdated `react-native-get-sms-android` with a custom Local Expo Module (`modules/expo-sms-reader`).
- Migrated SMS reading logic to the new `ExpoSmsReader` module for compatibility with Expo 55 and RN 0.83.
- Cleaned up deprecated type definitions.
