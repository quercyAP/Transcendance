"use client";
import Login from "../../components/Login";
import css from "../../styles/auth2fa.module.css";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavRef } from "../../context/navContext";


const LoginPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const baseUrl = process.env.REVERSE_PROXY_URL;
  const redirectUri = new URL("/login", baseUrl).href;
  const [token, setToken] = useState("");
  const {
    clientBaseUrl,
    is2faEnabled,
    setIs2faEnabled,
    isLoggedIn,
    setIsLoggedIn,
    is2faLoggedIn,
    setIs2faLoggedIn,
  } = useNavRef();

  useEffect(() => {
    const service = searchParams.get("service");
    const code = searchParams.get("code");
    if (code) {
      sendStatusCode(code, service);
    }
  }, []);

  const handleCodeChange = (event: any) => {
    setToken(event.target.value);
  };

  // le serveur crash ici ???
  const handleSubmitCode = async () => {
    const url = new URL("/api/auth/verify2fa", clientBaseUrl).href;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token }),
      });
      if (!response.ok) {
        console.error("Erreur lors de l'envoi du code au backend");
        return;
      } else {
        setIs2faLoggedIn(true);
        router.push("/", { scroll: false });

      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du code au backend", error);
    }
  };

  const sendStatusCode = async (code: string, service: any) => {
    try {
      const apiUrl =
        service === "github"
          ? "/api/auth/signinWithGithub"
          : "/api/auth/signin";
      const response = await fetch(
        new URL(
          `${apiUrl}?code=${encodeURIComponent(code)}&url=${redirectUri}`,
          baseUrl
        ).href,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setIsLoggedIn(true);
        const response = await fetch("/api/auth/get2faStatus", {
          method: "GET",
        });
        const data = await response.json();
        setIs2faEnabled(data);
        if (!data || (data && is2faLoggedIn)) {
          router.push("/", { scroll: false });
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const disable2fa = async () => { 
    const url = new URL("/api/auth/turnOffTwoFactorAuth", clientBaseUrl).href;
    try {
      const response = await fetch(url, { method: "POST" });
      if (response.ok) {
        setIs2faEnabled(false);
      } else {
        console.error("Failed to disable 2FA:", response);
      }
    } catch (error) {
      console.log("2FA error:", error);
    }
  }
  
  return (
    <>
        {!isLoggedIn && <Login redirectUri={redirectUri} />}
        {isLoggedIn && is2faEnabled && !is2faLoggedIn && (
          <div className={`${css.Box}`}>
            <div className={`${css.Before}`}>
              <div className={`${css.Container}`}>
                <div className={`${css.Text}`}>2FA</div>
                <input
                  type="text"
                  value={token}
                  onChange={handleCodeChange}
                  placeholder="Enter The 6-digit code"
                />
                <button onClick={handleSubmitCode}>Submit</button>
                <button onClick={disable2fa}>Disable 2FA</button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default LoginPage;
