// Ponto único de acesso a dados do app. Todas as telas importam daqui.
// Quando o usuário está no modo de teste (DEMO_UID), as operações vão para o
// localStorage do navegador. Caso contrário, vão para o Firestore de verdade.

import * as firestore from "../firebase/firestoreHelpers";
import * as local from "./localStore";

export const DEMO_UID = "demo-local";

function isDemo(uid) {
  return uid === DEMO_UID;
}

export function listenCollection(uid, path, callback, orderField) {
  return isDemo(uid)
    ? local.listenCollection(uid, path, callback, orderField)
    : firestore.listenCollection(uid, path, callback, orderField);
}

export function getAllOnce(uid, path, orderField) {
  return isDemo(uid) ? local.getAllOnce(uid, path, orderField) : firestore.getAllOnce(uid, path, orderField);
}

export function getOne(uid, path, id) {
  return isDemo(uid) ? local.getOne(uid, path, id) : firestore.getOne(uid, path, id);
}

export function createItem(uid, path, data) {
  return isDemo(uid) ? local.createItem(uid, path, data) : firestore.createItem(uid, path, data);
}

export function updateItem(uid, path, id, data) {
  return isDemo(uid) ? local.updateItem(uid, path, id, data) : firestore.updateItem(uid, path, id, data);
}

export function deleteItem(uid, path, id) {
  return isDemo(uid) ? local.deleteItem(uid, path, id) : firestore.deleteItem(uid, path, id);
}

export function listenSubCollection(uid, parentPath, parentId, subPath, callback, orderField) {
  return isDemo(uid)
    ? local.listenSubCollection(uid, parentPath, parentId, subPath, callback, orderField)
    : firestore.listenSubCollection(uid, parentPath, parentId, subPath, callback, orderField);
}

export function getSubCollectionOnce(uid, parentPath, parentId, subPath) {
  return isDemo(uid)
    ? local.getSubCollectionOnce(uid, parentPath, parentId, subPath)
    : firestore.getSubCollectionOnce(uid, parentPath, parentId, subPath);
}

export function createSubItem(uid, parentPath, parentId, subPath, data) {
  return isDemo(uid)
    ? local.createSubItem(uid, parentPath, parentId, subPath, data)
    : firestore.createSubItem(uid, parentPath, parentId, subPath, data);
}

export function updateSubItem(uid, parentPath, parentId, subPath, id, data) {
  return isDemo(uid)
    ? local.updateSubItem(uid, parentPath, parentId, subPath, id, data)
    : firestore.updateSubItem(uid, parentPath, parentId, subPath, id, data);
}

export function deleteSubItem(uid, parentPath, parentId, subPath, id) {
  return isDemo(uid)
    ? local.deleteSubItem(uid, parentPath, parentId, subPath, id)
    : firestore.deleteSubItem(uid, parentPath, parentId, subPath, id);
}

export function listenCollectionWhere(uid, path, field, value, callback) {
  return isDemo(uid)
    ? local.listenCollectionWhere(uid, path, field, value, callback)
    : firestore.listenCollectionWhere(uid, path, field, value, callback);
}
