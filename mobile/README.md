# ServiceHub Mobile

Expo React Native mobile app for the existing ServiceHub MERN backend.

## Run locally

```bash
npm install
npx expo install expo-secure-store react-native-safe-area-context @expo/vector-icons
npm run doctor
npm run android
```

The app now uses the shared website backend API. Production default: `https://all-in-one-services.onrender.com/api`.

For a physical Android phone, set `EXPO_PUBLIC_API_URL` to the website backend URL that the phone can reach, then rebuild the APK. Examples: `http://YOUR_COMPUTER_WIFI_IP:5000/api` for local Wi-Fi testing, or `https://YOUR-WEBSITE-BACKEND.onrender.com/api` for production.

If the phone still cannot connect, run this once in an Administrator PowerShell:

```powershell
netsh advfirewall firewall add rule name="ServiceHub Backend 5000" dir=in action=allow protocol=TCP localport=5000
```

## Android support

This app targets Expo SDK 56, React Native 0.85, and Hermes. Expo SDK 56 supports Android 7+ with Android target/compile SDK 36. The UI uses responsive flex layouts, `SafeAreaView`, `FlatList`/`SectionList`, memoized cards, virtualized list settings, image prefetching, and loading/empty/error fallbacks.
