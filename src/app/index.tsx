import { Redirect } from 'expo-router';

// The root layout handles the initial gateway and global redirect logic based on auth state.
// Here we just redirect somewhere as a fallback so we don't stay on an empty screen.
// By default, assume they need to connect. Root layout effect will correct this if they are authenticated.
export default function App() {
  return <Redirect href="/(auth)/connect" />;
}