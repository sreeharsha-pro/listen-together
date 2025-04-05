import app from './firebase';
import { getAuth, signInAnonymously } from "firebase/auth";

const auth = getAuth(app);

export const signInAnon = async () => {
    try {
        const result = await signInAnonymously(auth);
        console.log("Signed in:", result.user.uid);
    } catch (error) {
        console.log(error)
    }
};