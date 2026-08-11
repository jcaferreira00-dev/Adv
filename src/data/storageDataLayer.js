import * as storage from "../firebase/storageHelpers";
import * as local from "./localStorageFiles";
import { DEMO_UID } from "./dataLayer";

export function uploadFile(uid, folder, file) {
  return uid === DEMO_UID ? local.uploadFile(uid, folder, file) : storage.uploadFile(uid, folder, file);
}

export function removeFile(path, uid) {
  return uid === DEMO_UID ? local.removeFile() : storage.removeFile(path);
}
