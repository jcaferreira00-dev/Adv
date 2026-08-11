// cloud-sync.js — Firebase (Auth + Firestore) para o app Advocacia
// Segue o mesmo padrão dos outros apps: SDK modular via CDN, sem build step.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// -----------------------------------------------------------------------
// COLE AQUI AS CREDENCIAIS DO SEU PROJETO FIREBASE
// (Console do Firebase > Configurações do projeto > Seus apps > SDK)
// É a mesma configuração usada nos outros apps do mesmo projeto.
// -----------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCQBwZU8NK9YTGrnI-1-XDUhRGcmn3vMHs",
  authDomain: "ajuste-financeiro.firebaseapp.com",
  projectId: "ajuste-financeiro",
  storageBucket: "ajuste-financeiro.firebasestorage.app",
  messagingSenderId: "1084264963597",
  appId: "1:1084264963597:web:fbf369dfa8e5dcb1d1bf44",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {
  /* já habilitado ou navegador não suporta */
}

// Coleção raiz isolada deste app dentro do projeto Firebase compartilhado.
const ROOT = "advocacia_usuarios";
const ENTITIES = ["clientes", "procedimentos", "casos", "contatos"];

function col(uid, entity) {
  return collection(db, ROOT, uid, entity);
}

// ---------------- Auth ----------------
export function watchAuth(onUser, onGuest) {
  return onAuthStateChanged(auth, (user) => {
    if (user) onUser(user);
    else onGuest();
  });
}

export async function login(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

export async function registrar(email, senha) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

export function logout() {
  return signOut(auth);
}

// ---------------- Firestore CRUD ----------------
// Cada entidade guarda listas internas (documentos, anotações, checklist, etc.)
// como arrays dentro do próprio documento — evita sub-coleções e listeners extras.

export function watchEntity(uid, entity, callback) {
  if (!ENTITIES.includes(entity)) throw new Error("Entidade inválida: " + entity);
  return onSnapshot(col(uid, entity), (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(items);
  });
}

export async function criar(uid, entity, data) {
  const ref = await addDoc(col(uid, entity), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function atualizar(uid, entity, id, data) {
  const ref = doc(db, ROOT, uid, entity, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function remover(uid, entity, id) {
  const ref = doc(db, ROOT, uid, entity, id);
  await deleteDoc(ref);
}

// Usado pelo backup: grava um registro com um ID específico (do arquivo
// importado), em vez de deixar o Firestore gerar um novo — assim os vínculos
// entre cliente/procedimento/caso do backup continuam funcionando.
export async function definirComId(uid, entity, id, data) {
  if (!ENTITIES.includes(entity)) throw new Error("Entidade inválida: " + entity);
  const ref = doc(db, ROOT, uid, entity, id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
}

export function uid4() {
  return Math.random().toString(36).slice(2, 10);
}
