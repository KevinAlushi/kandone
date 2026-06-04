import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Project, Task, TaskStatus } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  await signInWithRedirect(auth, googleProvider);
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// Error handling helper
export enum OperationType { CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write' }
export interface FirestoreErrorInfo {
  error: string; operationType: OperationType; path: string | null;
  authInfo: { userId?: string | null; email?: string | null; emailVerified?: boolean | null; }
}
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Ignore benign permission errors that happen during logout when listeners are active
  if (
    errorMessage.includes('Missing or insufficient permissions.') &&
    operationType === OperationType.LIST &&
    !auth.currentUser
  ) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid, email: auth.currentUser?.email, emailVerified: auth.currentUser?.emailVerified,
    },
    operationType, path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Not throwing to avoid crashing the app on unhandled async errs
}
