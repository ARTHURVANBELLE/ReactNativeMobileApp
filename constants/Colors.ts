/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#f15a24';  // Strava-like orange
const tintColorDark = '#ff7d4d';    // Brighter orange for dark mode

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#cccccc',
    tabIconSelected: tintColorLight,
    border: '#e0e0e0',
    notification: '#ff3b30',
    card: '#f9f9f9',
    cardText: '#333333',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: tintColorDark,
    tabIconDefault: '#666666',
    tabIconSelected: tintColorDark,
    border: '#272729',
    notification: '#ff453a',
    card: '#1c1c1e',
    cardText: '#f0f0f0',
  },
};

export default Colors;
