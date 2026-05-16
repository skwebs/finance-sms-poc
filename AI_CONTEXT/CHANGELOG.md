# Changelog

## [2026-05-16] - Transaction Engine & DB Foundation

### Added
- `expo-sqlite` integration for local data persistence.
- Transaction Meaning Engine (`src/utils/transactionMeaning.ts`) for detecting transaction intent (spend, payment, debit, credit).
- Duplicate Prevention Strategy (`src/utils/deduplicateTransactions.ts`) using transaction fingerprinting/hashing.
- Normalized Database Schema (transactions, sms_messages, cards, settings).
- Native Bottom Tab Navigation using Expo Router.
- Monthly Expense Summary component on the Home tab.
- Transaction Details Modal for deep inspection of parsed data.
- Placeholder 'Cards' and 'Settings' tabs for future feature expansion.

### Changed
- Migrated main screen to `src/app/(tabs)/index.tsx`.
- Updated `parseSmsPreview` to include `transactionType` and `isExpense` flags.
- Enhanced Home UI with a premium-feel summary card.

### Fixed
- Improved expense calculation by excluding non-expense transactions (card payments, statement alerts).

## [2026-05-16] - UI/UX & Categorization Update
...

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
