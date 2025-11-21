import { initializeApp, getApps } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBx2UtmVxKWHhLzJ3NyBLR4azfgViu48vs",
  authDomain: "nails-fed39.firebaseapp.com",
  databaseURL: "https://nails-fed39-default-rtdb.firebaseio.com",
  projectId: "nails-fed39",
  storageBucket: "nails-fed39.appspot.com",
  messagingSenderId: "395625672032",
  appId: "1:395625672032:web:aff8d8ce4ef4913caf4205",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const storage = getStorage(app);

export async function uploadImageToFirebase(file: File, folder = "profile-media") {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
