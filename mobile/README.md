# ServiceHub Mobile

Expo React Native mobile app for the existing ServiceHub MERN backend.

## Run locally

```bash
npm install
npx expo install expo-secure-store react-native-safe-area-context @expo/vector-icons
npm run doctor
npm run android
```

The app is currently configured for this computer's Wi-Fi IP: `http://10.187.33.79:5000/api`.

For a physical Android phone, keep the phone and computer on the same Wi-Fi, start the backend, then rebuild the APK after changing `EXPO_PUBLIC_API_URL` if your computer IP changes. Android emulators can also use this Wi-Fi IP, or `http://10.0.2.2:5000/api` when testing only in the emulator.

If the phone still cannot connect, run this once in an Administrator PowerShell:

```powershell
netsh advfirewall firewall add rule name="ServiceHub Backend 5000" dir=in action=allow protocol=TCP localport=5000
```

## Android support

This app targets Expo SDK 56, React Native 0.85, and Hermes. Expo SDK 56 supports Android 7+ with Android target/compile SDK 36. The UI uses responsive flex layouts, `SafeAreaView`, `FlatList`/`SectionList`, memoized cards, virtualized list settings, image prefetching, and loading/empty/error fallbacks.
