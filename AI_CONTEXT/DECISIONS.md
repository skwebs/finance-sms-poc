# Decisions

## SMS Library Selection
- **Library**: `react-native-get-sms-android`
- **Reason**: It is the most established library for listing/reading existing SMS on Android. While older, it is compatible with the "Finance SMS POC" requirements for reading history.
- **Compatibility**: Integrated with TypeScript using a custom declaration file `src/types/react-native-get-sms-android.d.ts`.

## Architecture Choice
- **Local Module vs Library**: Chose to use an existing library first to minimize custom native code, but prepared a custom type declaration to ensure strict TS compliance.
- **Filtering**: Implemented client-side filtering using a simple keyword-based approach for the POC.
