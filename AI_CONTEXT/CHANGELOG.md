# Changelog

## [2026-05-16] - UI/UX & Categorization Update

### Added
- Advanced message categorization (Credit Card, Bank, UPI, Statement, General).
- Bank identification for SBI, HDFC, ICICI, AXIS, KOTAK, PNB, INDUSIND, UJJIVAN, IDFC, YES BANK, AIRTEL, PAYTM, SLICE, CBoI.
- Lightweight preview parsing for amounts, merchants, card/account endings, and due dates.
- New `src/components` directory with `MessageCard`, `BankChip`, `CategoryBadge`, and `CustomButton`.
- Custom professional header with permission status badge.
- Global header hiding in `_layout.tsx`.

### Changed
- Replaced `TouchableOpacity` with `Pressable` via `CustomButton`.
- Upgraded message read count from 20 to 50.
- Completely redesigned `index.tsx` for a modern finance app feel.
- Organized logic into `src/parsers`, `src/utils`, and `src/constants`.

### Fixed
- Improved SMS filtering by using bank identification logic.

## [2026-05-16] - Initial Setup
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
