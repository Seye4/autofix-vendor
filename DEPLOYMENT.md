# Auto Fix Vendor deployment

Expo project: https://expo.dev/accounts/sevemasterz/projects/autofix-vendor

Android package and iOS bundle identifier: `com.autofix.vendor`.
URL scheme: `autofix-vendor`.

Run these commands from this folder with EAS CLI installed and signed in to an account with access to the project.

## Install and verify

```sh
npm ci --include=dev
npx expo export --platform android --platform ios
```

## Installable Android preview

```sh
eas build --platform android --profile preview
```

This produces an APK. EAS will guide you through Android signing credentials on the first build.

## Store builds

```sh
eas build --platform android --profile production
eas build --platform ios --profile production
```

Production Android builds produce an AAB. Production build numbers are managed and incremented by EAS. iOS builds require Apple Developer signing credentials.

After reviewing and testing the build, submit separately:

```sh
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

Store listings and submission credentials must be configured for this vendor app, separately from the customer app.

## Runtime configuration

Release builds currently use `https://seveinteractive.com/api`, configured in `src/storage/authStorage.ts`. Verify that this is the deployed backend before distributing a build.

Push registration reads this app's linked EAS project ID. Android push notifications also require Firebase configuration and FCM credentials; iOS requires APNs credentials. Configure these for `com.autofix.vendor` before testing push notifications.

Native Google Maps usage on Android requires a Maps SDK API key configured for this package and its signing certificate. No Maps key is currently configured in app.json.

## Validation limits

The npm clean-install dry run and Android/iOS Metro exports passed during setup. A cloud native build and store submission have not been run.

The project still has existing TypeScript errors in legacy API callers, backup screens, and reference files. Web export fails because react-native-maps imports native-only modules. This setup targets Android and iOS.
