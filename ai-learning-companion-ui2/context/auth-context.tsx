// "use client";

// import React, { createContext, useContext, useState, useEffect } from "react";

// interface User {
//   id: string;
//   email: string;
//   name: string;
//   token: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<void>;
//   signup: (name: string, email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Check for existing session
//     const verifySession = async () => {
//       try {
//         const storedUser = localStorage.getItem("user");
//         if (storedUser) {
//           const userData = JSON.parse(storedUser);

//           // Verify token with backend
//           const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
//             headers: {
//               Authorization: `Bearer ${userData.token}`,
//             },
//           });

//           if (response.ok) {
//             const verifiedUser = await response.json();
//             setUser(verifiedUser);
//           } else {
//             // Token is invalid or expired
//             localStorage.removeItem("user");
//           }
//         }
//       } catch (error) {
//         // Clear invalid data
//         localStorage.removeItem("user");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     verifySession();
//   }, []);

//   const login = async (email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.detail || "Login failed");
//       }

//       const userData: User = await response.json();
//       setUser(userData);
//       localStorage.setItem("user", JSON.stringify(userData));
//     } catch (error) {
//       throw error instanceof Error ? error : new Error("Login failed");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const signup = async (name: string, email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ name, email, password }),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.detail || "Signup failed");
//       }

//       const userData: User = await response.json();
//       setUser(userData);
//       localStorage.setItem("user", JSON.stringify(userData));
//     } catch (error) {
//       throw error instanceof Error ? error : new Error("Signup failed");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       if (user?.token) {
//         await fetch(`${API_BASE_URL}/api/auth/logout`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ token: user.token }),
//         });
//       }
//     } catch (error) {
//       console.error("Logout error:", error);
//     } finally {
//       setUser(null);
//       localStorage.removeItem("user");
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  user_id: string;
  username: string;
  email: string;
  full_name:  string | null;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password:  string) => Promise<void>;
  signup: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React. ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const verifySession = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          // Verify token with backend using /me endpoint
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization:  `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setToken(storedToken);
          } else {
            // Token is invalid or expired
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Session verification error:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage. removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response. ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }

      const data = await response.json();
      
      // Backend returns:  { access_token, token_type, user }
      setUser(data.user);
      setToken(data.access_token);
      
      localStorage.setItem("token", data. access_token);
      localStorage. setItem("user", JSON.stringify(data.user));
    } catch (error) {
      throw error instanceof Error ? error : new Error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers:  {
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ 
          username,
          email, 
          password,
          full_name: fullName 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Signup failed");
      }

      const data = await response.json();
      
      // Backend returns: { access_token, token_type, user }
      setUser(data.user);
      setToken(data. access_token);
      
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON. stringify(data.user));
    } catch (error) {
      throw error instanceof Error ? error : new Error("Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        // Backend logout endpoint (optional)
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}