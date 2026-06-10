# Debug Notes

## Issue: Blank screen in preview
- Screenshot shows only the splash screen animation (golden sparkle icon) on a beige background
- The splash screen seems to be stuck and never transitions to the login or home screen
- The splash screen has a 3-second timer that should redirect to login or home
- Possible issue: the splash screen animation/timer is not working correctly on web, or the navigation redirect is failing

## Root Cause Hypothesis
- The splash screen uses `useAnimatedStyle` from react-native-reanimated which may not work correctly on web preview
- Or the router.replace() call is not executing after the timeout
- Need to check app/_layout.tsx and app/splash.tsx
