import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Substitua os valores abaixo pelas credenciais do seu projeto Firebase
// (Configurações do projeto > Geral > Seus apps > SDK do Firebase).
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Permite que o app funcione offline e sincronize depois.
enableIndexedDbPersistence(db).catch(() => {
  // Ocorre se o app estiver aberto em mais de uma aba ao mesmo tempo;
  // não é um erro grave, apenas a persistência offline não é ativada nessa aba.
});
