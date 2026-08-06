import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (authUser) {
      const serverUrl =
        import.meta.env.VITE_BACKEND_URL ||
        (window.location.hostname === "localhost" ? "http://localhost:5000" : "/");

      const socketInstance = io(serverUrl, {
        query: {
          userId: authUser._id,
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        console.log("Socket disconnected");
      });

      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socketInstance.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
