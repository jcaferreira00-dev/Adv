import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { DEMO_UID } from "../data/dataLayer";

const AuthContext = createContext(null);
const DEMO_FLAG_KEY = "advocacia-pwa:demo-mode";

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isDemo, setIsDemo] = useState(() => window.localStorage.getItem(DEMO_FLAG_KEY) === "1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        setFirebaseUser(u);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  const user = isDemo
    ? { uid: DEMO_UID, email: "Modo de teste (sem sincronização)", isDemo: true }
    : firebaseUser;

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);

  const loginDemo = () => {
    window.localStorage.setItem(DEMO_FLAG_KEY, "1");
    setIsDemo(true);
  };

  const logout = () => {
    if (isDemo) {
      window.localStorage.removeItem(DEMO_FLAG_KEY);
      setIsDemo(false);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const value = { user, loading, login, register, logout, resetPassword, loginDemo, isDemo };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
