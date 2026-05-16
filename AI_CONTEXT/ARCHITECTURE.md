# Architecture

## Folder Structure
- `src/`: Source code
  - `app/`: Expo Router screens
  - `components/`: Reusable UI components (`MessageCard`, `BankChip`, etc.)
  - `constants/`: Configuration (`banks.ts`, `messageCategories.ts`)
  - `parsers/`: SMS parsing logic
    - `common/`: Amount, date, and reference extractors
    - `banks/`: Bank-specific parsing (future)
  - `utils/`: General utilities (`messageClassifier.ts`)
  - `types/`: Type definitions
- `modules/`: Local native modules
  - `expo-sms-reader/`: Custom Android SMS reader module

## Architecture Decisions
- **Local Native Modules**: Use custom Expo modules instead of outdated third-party libraries for better compatibility with New Architecture.
- **Lightweight Parsing**: Use regex-based extraction for immediate UI feedback without heavy database overhead.
- **Categorization First**: Messages are classified into high-level financial categories (Bank, Card, UPI) before deep parsing.
- **Future Ready**: Parsing architecture is designed to support complex billing cycles and statement analysis.

## UI/UX Standards
- Use `Pressable` for interactive elements.
- Modern, clean typography and spacing.
- Visual hierarchy using bank chips and category badges.
- Standardized button variants via `CustomButton`.
