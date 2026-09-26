# Native Android and iOS apps

The `android/` and `ios/` directories are real native projects powered by Capacitor. They embed the same production React application as the website and can call native device APIs.

## Included now

- Native Android Studio project (`com.novamarket.shop`)
- Native Xcode project (`com.novamarket.shop`)
- Push-notification permission and token registration
- Local notification support for demo order updates
- Notification-tap and `novamarket://` deep-link handling
- Native splash-screen, status-bar, RTL, and app lifecycle support
- No notification prompt in the browser version

## Synchronize changes

After changing the React application, copy the latest production build into both apps:

```bash
npm run native:sync
```

Or synchronize one platform:

```bash
npm run android:sync
npm run ios:sync
```

## Android build

Install Android Studio (including its Android SDK) and JDK 21, then:

```bash
npm run android:open
```

Run on an emulator/device from Android Studio. For a local debug APK:

```bash
npm run android:build
```

The result is written under `android/app/build/outputs/apk/debug/`. Release AAB/APK builds require a private signing keystore; never commit that keystore or its passwords.

For remote push notifications, create a Firebase Android app with package `com.novamarket.shop`, place its private `google-services.json` in `android/app/`, and follow the Capacitor Push Notifications Firebase setup. This credential is deliberately not fabricated or committed.

## iPhone/iPad build (Mac required)

On a Mac with Xcode installed:

```bash
npm install
npm run ios:sync
npm run ios:open
```

In Xcode:

1. Select your Apple Developer team under Signing & Capabilities.
2. Confirm the bundle identifier `com.novamarket.shop` is available to your team.
3. Add the **Push Notifications** capability.
4. Add **Background Modes → Remote notifications**.
5. Select an iPhone simulator/device and run.
6. Use Product → Archive for TestFlight/App Store distribution.

APNs provisioning and a paid Apple Developer account are required for remote push notifications and store distribution. Local notifications can be tested without a notification server.

## Remote notification backend

The apps request permission and obtain native device tokens. Production delivery still needs a trusted backend that stores tokens per signed-in user and sends messages through Firebase/APNs. Never ship Firebase service-account or APNs private keys inside either app.
