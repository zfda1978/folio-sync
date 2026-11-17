import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  auth,
  db,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  OperationType,
  handleFirestoreError,
  FirebaseUser,
} from '../firebase';
import { QuizAttempt, WorkspaceRole } from '../types';

export type AuthProviderKind = 'google' | 'password';

export interface AuthUser {
  uid: string;
  displayName: string;
  email?: string | null;
  photoUrl?: string | null;
  emailVerified: boolean;
  provider: AuthProviderKind;
  isFirebaseBacked: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signingInProvider: AuthProviderKind | null;
  authError: string | null;
  emailNeedsConfig: boolean;
  clearAuthError: () => void;
  signInWithGmail: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<boolean>;
  signOutAll: () => Promise<void>;
  syncWorkspaceRoleToCloud: (role: WorkspaceRole) => Promise<void>;
  loadProfileRoleFromCloud: () => Promise<WorkspaceRole | null>;
  saveAttemptToCloud: (attempt: QuizAttempt) => Promise<void>;
  loadAttemptsFromCloud: () => Promise<QuizAttempt[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sanitizeDisplayName(raw?: string | null, fallback = 'ZENOXIS Learner'): string {
  const cleaned = (raw || '').trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, 120);
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return (cleaned || `id_${Date.now()}`).slice(0, 128);
}

function resolveFirebaseProvider(fbUser: FirebaseUser): AuthProviderKind {
  const pid = fbUser.providerData?.[0]?.providerId || '';
  if (pid === 'password') return 'password';
  return 'google';
}

function getLocalRoleFallback(): WorkspaceRole {
  try {
    const saved = localStorage.getItem('zenoxis_role');
    if (saved === 'student' || saved === 'teacher') return saved;
  } catch {
    // ignore
  }
  return 'teacher';
}

function mapFirebaseAuthError(err: any, fallbackMessage: string): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Browser blocked the sign-in popup. Please allow popups for this site and retry.';
    case 'auth/unauthorized-domain':
      return 'This domain must be added to Authorized Domains in Firebase Console Authentication settings.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to Sign In or use Continue with Gmail.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-up is not yet enabled in Firebase Console. Follow the steps below to enable it.';
    default:
      return err?.message || fallbackMessage;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingInProvider, setSigningInProvider] = useState<AuthProviderKind | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailNeedsConfig, setEmailNeedsConfig] = useState(false);

  const syncFirebaseProfileToFirestore = useCallback(
    async (fbUser: FirebaseUser, explicitDisplayName?: string) => {
      const uid = fbUser.uid;
      const provider = resolveFirebaseProvider(fbUser);
      const providerId =
        fbUser.providerData?.[0]?.providerId || (provider === 'password' ? 'password' : 'google.com');
      const displayName = sanitizeDisplayName(
        explicitDisplayName || fbUser.displayName || fbUser.email?.split('@')[0],
        'ZENOXIS Learner'
      );
      const photoUrl =
        fbUser.photoURL && fbUser.photoURL.length <= 1000 ? fbUser.photoURL : undefined;
      const email = fbUser.email && fbUser.email.length <= 254 ? fbUser.email : undefined;

      const userDocPath = `users/${uid}`;
      const userDocRef = doc(db, 'users', uid);

      try {
        const existingSnap = await getDoc(userDocRef);
        if (!existingSnap.exists()) {
          await setDoc(userDocRef, {
            uid,
            displayName,
            provider,
            workspaceRole: getLocalRoleFallback(),
            ...(photoUrl ? { photoUrl } : {}),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(userDocRef, {
            displayName,
            ...(photoUrl ? { photoUrl } : {}),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userDocPath);
      }

      const privatePath = `users/${uid}/private/info`;
      const privateRef = doc(db, 'users', uid, 'private', 'info');

      try {
        const privSnap = await getDoc(privateRef);
        if (!privSnap.exists()) {
          await setDoc(privateRef, {
            uid,
            providerId,
            ...(email ? { email } : {}),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(privateRef, {
            providerId,
            ...(email ? { email } : {}),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, privatePath);
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const provider = resolveFirebaseProvider(fbUser);
        setUser({
          uid: fbUser.uid,
          displayName: sanitizeDisplayName(
            fbUser.displayName || fbUser.email?.split('@')[0],
            'ZENOXIS User'
          ),
          email: fbUser.email,
          photoUrl: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
          provider,
          isFirebaseBacked: true,
        });
        syncFirebaseProfileToFirestore(fbUser).catch((err) => {
          console.warn('Profile sync warning:', err);
        });
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [syncFirebaseProfileToFirestore]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signInWithGmail = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    setSigningInProvider('google');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      return true;
    } catch (err: any) {
      setAuthError(mapFirebaseAuthError(err, 'Unable to sign in with Gmail right now.'));
      return false;
    } finally {
      setSigningInProvider(null);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setSigningInProvider('password');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setEmailNeedsConfig(false);
      return true;
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setEmailNeedsConfig(true);
      }
      setAuthError(mapFirebaseAuthError(err, 'Unable to sign in with email and password.'));
      return false;
    } finally {
      setSigningInProvider(null);
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (fullName: string, email: string, password: string): Promise<boolean> => {
      setAuthError(null);
      setSigningInProvider('password');
      const cleanName = sanitizeDisplayName(fullName, email.split('@')[0] || 'ZENOXIS Learner');
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: cleanName });
        setUser({
          uid: cred.user.uid,
          displayName: cleanName,
          email: cred.user.email,
          photoUrl: cred.user.photoURL,
          emailVerified: cred.user.emailVerified,
          provider: 'password',
          isFirebaseBacked: true,
        });
        await syncFirebaseProfileToFirestore(cred.user, cleanName);
        sendEmailVerification(cred.user).catch(() => {
          // Best-effort verification email
        });
        setEmailNeedsConfig(false);
        return true;
      } catch (err: any) {
        if (err?.code === 'auth/operation-not-allowed') {
          setEmailNeedsConfig(true);
        }
        setAuthError(mapFirebaseAuthError(err, 'Unable to create your account right now.'));
        return false;
      } finally {
        setSigningInProvider(null);
      }
    },
    [syncFirebaseProfileToFirestore]
  );

  const signOutAll = useCallback(async () => {
    setAuthError(null);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setUser(null);
  }, []);

  const syncWorkspaceRoleToCloud = useCallback(async (role: WorkspaceRole) => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const path = `users/${fbUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', fbUser.uid), {
        workspaceRole: role,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }, []);

  const loadProfileRoleFromCloud = useCallback(async (): Promise<WorkspaceRole | null> => {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    const path = `users/${fbUser.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (snap.exists()) {
        const role = snap.data()?.workspaceRole;
        if (role === 'teacher' || role === 'student') return role;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }, []);

  const saveAttemptToCloud = useCallback(async (attempt: QuizAttempt) => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    const attemptId = sanitizeId(attempt.id);
    const path = `users/${fbUser.uid}/attempts/${attemptId}`;

    try {
      await setDoc(doc(db, 'users', fbUser.uid, 'attempts', attemptId), {
        id: attemptId,
        ownerId: fbUser.uid,
        questionnaireId: sanitizeId(attempt.questionnaireId),
        questionnaireTitle: (attempt.questionnaireTitle || 'ZENOXIS Assessment').slice(0, 250),
        bookTitle: (attempt.bookTitle || 'Untitled Volume').slice(0, 250),
        score: Math.max(0, Number(attempt.score) || 0),
        totalPoints: Math.max(0, Number(attempt.totalPoints) || 0),
        percentage: Math.min(100, Math.max(0, Number(attempt.percentage) || 0)),
        timeSpentSeconds: Math.max(0, Number(attempt.timeSpentSeconds) || 0),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }, []);

  const loadAttemptsFromCloud = useCallback(async (): Promise<QuizAttempt[]> => {
    const fbUser = auth.currentUser;
    if (!fbUser) return [];

    const path = `users/${fbUser.uid}/attempts`;
    try {
      const q = query(
        collection(db, 'users', fbUser.uid, 'attempts'),
        where('ownerId', '==', fbUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const createdIso =
          d.createdAt && typeof d.createdAt.toDate === 'function'
            ? d.createdAt.toDate().toISOString()
            : new Date().toISOString();
        return {
          id: d.id || docSnap.id,
          questionnaireId: d.questionnaireId,
          questionnaireTitle: d.questionnaireTitle,
          bookTitle: d.bookTitle,
          date: createdIso,
          score: Number(d.score) || 0,
          totalPoints: Number(d.totalPoints) || 0,
          percentage: Number(d.percentage) || 0,
          timeSpentSeconds: Number(d.timeSpentSeconds) || 0,
          answers: {},
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !authReady,
        signingInProvider,
        authError,
        emailNeedsConfig,
        clearAuthError,
        signInWithGmail,
        signInWithEmail,
        signUpWithEmail,
        signOutAll,
        syncWorkspaceRoleToCloud,
        loadProfileRoleFromCloud,
        saveAttemptToCloud,
        loadAttemptsFromCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
