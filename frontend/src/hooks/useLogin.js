import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { ensureUserKeyPair } from "../utils/crypto";

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuthContext();

  const login = async (username, password) => {
    const success = handleInputErrors(username, password);
    if (!success) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Ensure E2EE key pair exists locally or generate & update server
      const updatedPublicKey = await ensureUserKeyPair(
        data._id,
        data.publicKey,
        async (newPubKey) => {
          await fetch("/api/users/public-key", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicKey: newPubKey }),
          });
        }
      );

      const finalUser = { ...data, publicKey: updatedPublicKey || data.publicKey };

      localStorage.setItem("chat-user", JSON.stringify(finalUser));
      setAuthUser(finalUser);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, login };
};

export default useLogin;

function handleInputErrors(username, password) {
  if (!username || !password) {
    toast.error("Please fill in all fields");
    return false;
  }

  return true;
}
