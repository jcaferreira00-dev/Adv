// Implementação "espelho" das funções do Firestore, mas gravando no localStorage
// do navegador. Usada exclusivamente pelo modo de teste (DEMO_UID), para permitir
// experimentar o sistema mesmo sem um projeto Firebase configurado.

const bus = new EventTarget();

function safeParse(raw) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readList(key) {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(key));
}

function writeList(key, list) {
  window.localStorage.setItem(key, JSON.stringify(list));
  bus.dispatchEvent(new Event(key));
}

function newId() {
  return `demo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function collectionKey(uid, path) {
  return `demo:${uid}:${path}`;
}

function subCollectionKey(uid, parentPath, parentId, subPath) {
  return `demo:${uid}:${parentPath}:${parentId}:${subPath}`;
}

function sortByField(items, field) {
  return items.slice().sort((a, b) => {
    const av = a[field] ?? 0;
    const bv = b[field] ?? 0;
    return av > bv ? -1 : av < bv ? 1 : 0;
  });
}

function sortByFieldAsc(items, field) {
  return items.slice().sort((a, b) => {
    const av = a[field] ?? 0;
    const bv = b[field] ?? 0;
    return av > bv ? 1 : av < bv ? -1 : 0;
  });
}

export function listenCollection(uid, path, callback, orderField = "createdAt") {
  const key = collectionKey(uid, path);
  const emit = () => callback(sortByField(readList(key), orderField));
  emit();
  bus.addEventListener(key, emit);
  return () => bus.removeEventListener(key, emit);
}

export async function getAllOnce(uid, path, orderField = "createdAt") {
  return sortByField(readList(collectionKey(uid, path)), orderField);
}

export async function getOne(uid, path, id) {
  const item = readList(collectionKey(uid, path)).find((i) => i.id === id);
  return item || null;
}

export async function createItem(uid, path, data) {
  const key = collectionKey(uid, path);
  const list = readList(key);
  const id = newId();
  const now = Date.now();
  list.push({ id, ...data, createdAt: now, updatedAt: now });
  writeList(key, list);
  return id;
}

export async function updateItem(uid, path, id, data) {
  const key = collectionKey(uid, path);
  const list = readList(key);
  const index = list.findIndex((i) => i.id === id);
  if (index === -1) return;
  list[index] = { ...list[index], ...data, updatedAt: Date.now() };
  writeList(key, list);
}

export async function deleteItem(uid, path, id) {
  const key = collectionKey(uid, path);
  writeList(key, readList(key).filter((i) => i.id !== id));
}

export function listenSubCollection(uid, parentPath, parentId, subPath, callback, orderField = "order") {
  const key = subCollectionKey(uid, parentPath, parentId, subPath);
  const emit = () => callback(sortByFieldAsc(readList(key), orderField));
  emit();
  bus.addEventListener(key, emit);
  return () => bus.removeEventListener(key, emit);
}

export async function getSubCollectionOnce(uid, parentPath, parentId, subPath) {
  return readList(subCollectionKey(uid, parentPath, parentId, subPath));
}

export async function createSubItem(uid, parentPath, parentId, subPath, data) {
  const key = subCollectionKey(uid, parentPath, parentId, subPath);
  const list = readList(key);
  const id = newId();
  list.push({ id, ...data });
  writeList(key, list);
  return id;
}

export async function updateSubItem(uid, parentPath, parentId, subPath, id, data) {
  const key = subCollectionKey(uid, parentPath, parentId, subPath);
  const list = readList(key);
  const index = list.findIndex((i) => i.id === id);
  if (index === -1) return;
  list[index] = { ...list[index], ...data };
  writeList(key, list);
}

export async function deleteSubItem(uid, parentPath, parentId, subPath, id) {
  const key = subCollectionKey(uid, parentPath, parentId, subPath);
  writeList(key, readList(key).filter((i) => i.id !== id));
}

export function listenCollectionWhere(uid, path, field, value, callback) {
  const key = collectionKey(uid, path);
  const emit = () => callback(readList(key).filter((i) => i[field] === value));
  emit();
  bus.addEventListener(key, emit);
  return () => bus.removeEventListener(key, emit);
}
