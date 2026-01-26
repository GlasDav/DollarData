# Mobile Google Authentication Setup Guide

This guide outlines the steps required to enable Google Sign-In for the DollarData mobile application using Supabase and Expo.

## Prerequisites

- Access to Google Cloud Console
- Access to Supabase Dashboard
- Expo Application functionality

## Step 1: Google Cloud Console Setup

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Select the **DollarData** project.
3.  Navigate to **APIs & Services > OAuth consent screen**.
    - Ensure "User Type" is set to **External**.
    - Verify App Information (Name: DollarData, Support Email, etc.).
4.  Navigate to **Credentials**.
5.  **Create OAuth Client ID for iOS:**
    - Click **Create Credentials > OAuth client ID**.
    - Application type: **iOS**.
    - Bundle ID: `com.dollardata.mobile` (or your Expo bundle ID).
    - Team ID: Your Apple Team ID (if applicable).
    - Click **Create**. Copy the **Client ID** (e.g., `IOS_CLIENT_ID`).
    - **iOS URL Scheme:** You may need to add a URL scheme to `app.json` (e.g., `com.googleusercontent.apps.IOS_CLIENT_ID_REVERSED`).
6.  **Create OAuth Client ID for Android:**
    - Click **Create Credentials > OAuth client ID**.
    - Application type: **Android**.
    - Package name: `com.dollardata.mobile`.
    - SHA-1 Certificate Fingerprint: Run `npx expo fetch:android:hashes` (for managed workflow) or use your keystore.
    - Click **Create**. Copy the **Client ID** (e.g., `ANDROID_CLIENT_ID`).
7.  **Create OAuth Client ID for Web (Required for Supabase):**
    - If not already created, create a **Web application** client ID.
    - Authorized JavaScript origins: `https://<project-id>.supabase.co`.
    - Authorized redirect URIs: `https://<project-id>.supabase.co/auth/v1/callback`.
    - Copy the **Client ID** (`WEB_CLIENT_ID`).

## Step 2: Supabase Configuration

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Authentication > Providers**.
3.  Select **Google**.
4.  **Google Client ID:** Enter the `WEB_CLIENT_ID` from step 1.7.
5.  **Google Client Secret:** Enter the secret for the Web Client.
6.  **Authorized Client IDs:** Add your iOS and Android Client IDs here (comma-separated, usually).
    - *Note:* Supabase often requires the `WEB_CLIENT_ID` to be the primary configuration, while native apps pass their ID tokens.
7.  Enable the provider and click **Save**.

## Step 3: Expo Configuration (`app.json`)

Update `mobile/app.json` to include the URL schemes.

```json
{
  "expo": {
    "scheme": "dollardata",
    "ios": {
      "bundleIdentifier": "com.dollardata.mobile",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.<YOUR_IOS_CLIENT_ID>"
            ]
          }
        ]
      }
    },
    "android": {
      "package": "com.dollardata.mobile"
    }
  }
}
```

## Step 4: Environment Variables

Add the Client IDs to your `.env` file in the `mobile` directory.

```properties
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

## Step 5: Install Dependencies

We are using `@react-native-google-signin/google-signin` (standard for React Native/Expo now).

```bash
npx expo install @react-native-google-signin/google-signin
```

## Step 6: Code Implementation (Already Started)

The `GoogleSignin` configuration should be initialized in `AuthContext.tsx` or a dedicated hook.

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  // ...
});
```
