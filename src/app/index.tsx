import { Redirect } from 'expo-router';

// This entry belongs to the authenticated stack. The auth group is protected
// after pairing, so redirecting there would bounce back here indefinitely.
export default function App() {
  return <Redirect href="/(dashboard)" />;
}
