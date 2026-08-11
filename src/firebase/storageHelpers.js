import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

export async function uploadFile(uid, folder, file) {
  const path = `users/${uid}/${folder}/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, path, name: file.name };
}

export async function removeFile(path) {
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}
