const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': "That email or password isn't right. Double-check and try again.",
  'auth/wrong-password': "That password isn't right. Try again.",
  'auth/user-not-found': "We couldn't find an account with that email.",
  'auth/invalid-email': "That doesn't look like a valid email address.",
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts — wait a bit and try again.',
  'auth/popup-closed-by-user': '', // user-cancelled, not an error worth showing
  'auth/cancelled-popup-request': '',
  'auth/network-request-failed': "Couldn't reach the server — check your connection and try again.",
  'auth/unauthorized-domain': "This site isn't set up to sign in from here yet.",
};

export function authErrorMessage(code: string): string | null {
  if (code in AUTH_MESSAGES) return AUTH_MESSAGES[code] || null;
  console.error('[auth] unmapped error code:', code);
  return "Something went wrong signing in. Try again in a moment.";
}

export function firestoreErrorMessage(code: string): string {
  if (code === 'permission-denied') {
    console.error('[firestore] permission-denied — check security rules deployment');
    return "You don't have access to this right now. Try refreshing, or ask whoever set this up to check the household settings.";
  }
  console.error('[firestore] unmapped error code:', code);
  return 'Something went wrong loading this. Try again in a moment.';
}
