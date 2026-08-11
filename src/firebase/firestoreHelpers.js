import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// Todas as coleções principais ficam dentro de users/{uid}/...
// Isso garante que cada advogado só acesse os próprios dados.
function userCollection(uid, path) {
  return collection(db, "users", uid, path);
}

export function listenCollection(uid, path, callback, orderField = "createdAt") {
  const q = query(userCollection(uid, path), orderBy(orderField, "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function getAllOnce(uid, path, orderField = "createdAt") {
  const q = query(userCollection(uid, path), orderBy(orderField, "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOne(uid, path, id) {
  const ref = doc(db, "users", uid, path, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createItem(uid, path, data) {
  const ref = await addDoc(userCollection(uid, path), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateItem(uid, path, id, data) {
  const ref = doc(db, "users", uid, path, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteItem(uid, path, id) {
  const ref = doc(db, "users", uid, path, id);
  await deleteDoc(ref);
}

// Subcoleções (ex: checklist dentro de um caso, lições dentro de um caso)
function subCollection(uid, parentPath, parentId, subPath) {
  return collection(db, "users", uid, parentPath, parentId, subPath);
}

export function listenSubCollection(
  uid,
  parentPath,
  parentId,
  subPath,
  callback,
  orderField = "order"
) {
  const q = query(
    subCollection(uid, parentPath, parentId, subPath),
    orderBy(orderField, "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function getSubCollectionOnce(uid, parentPath, parentId, subPath) {
  const snapshot = await getDocs(subCollection(uid, parentPath, parentId, subPath));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createSubItem(uid, parentPath, parentId, subPath, data) {
  const ref = await addDoc(subCollection(uid, parentPath, parentId, subPath), data);
  return ref.id;
}

export async function updateSubItem(uid, parentPath, parentId, subPath, id, data) {
  const ref = doc(db, "users", uid, parentPath, parentId, subPath, id);
  await updateDoc(ref, data);
}

export async function deleteSubItem(uid, parentPath, parentId, subPath, id) {
  const ref = doc(db, "users", uid, parentPath, parentId, subPath, id);
  await deleteDoc(ref);
}

// Consultas filtradas (ex: casos de um determinado procedimento ou cliente)
export function listenCollectionWhere(uid, path, field, value, callback) {
  const q = query(userCollection(uid, path), where(field, "==", value));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}
