# Architecture

## Folder Structure
- `src/`: Source code
  - `app/`: Expo Router screens & (tabs) group
  - `components/`: Reusable UI components (`MessageCard`, `TransactionDetailsModal`, etc.)
  - `db/`: Database schema and persistence logic (`database.ts`, `transactionStore.ts`)
  - `constants/`: Configuration (`banks.ts`, `messageCategories.ts`)
  - `parsers/`: SMS parsing logic
  - `utils/`: Logic engines (`transactionMeaning.ts`, `deduplicateTransactions.ts`)
- `modules/`: Local native modules
  - `expo-sms-reader/`: Custom Android SMS reader module

## Architecture Decisions
- **Local SQLite Persistence**: Use `expo-sqlite` to store transactions and raw SMS for offline analysis and fast performance.
- **Transaction Fingerprinting**: Generate unique hashes for transactions to prevent double-counting across multiple SMS notifications.
- **Intent-Based Categorization**: Beyond just "Bank" or "Card", detect "Spend" vs "Payment" to accurately calculate expenses.
- **Native Bottom Tabs**: Standard mobile navigation pattern for multi-feature scalability.

## Database Schema
- `transactions`: Normalized financial records with parsed fields and expense flags.
- `sms_messages`: Audit log of raw SMS data.
- `cards`: Configuration for credit card billing cycles.
- `settings`: Key-value store for user preferences.

## UI/UX Standards
- Use `Modal` for detailed transaction inspection.
- Premium visual feel for financial summaries (dark mode cards, local currency formatting).
- Native-first navigation and interaction feedback.
