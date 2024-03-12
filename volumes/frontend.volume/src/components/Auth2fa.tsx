"user client";
import css from "../styles/twoAuth.module.css";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useNavRef } from "../context/navContext";

const Auth2fa = () => {
  const {
    clientBaseUrl,
    is2faEnabled,
    setIs2faEnabled,
    qrCodeUrl,
    currentUser,
    isCodeScanned,
    setIsCodeScanned,
    setShowStartButton,
    is2faLoggedIn,
  } = useNavRef();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (currentUser?.is2FAEnabled) {
      setIsCodeScanned(false);
    }
  }, []);

  const codeScanned = async () => {
    setIsCodeScanned(true);
    setShowStartButton(true);
  };

  return (
    <>
      {!isCodeScanned && (
        <div className={`${css.Box}`}>
          <div className={`${css.Before}`}>
            <div className={`${css.Container}`}>
              <div className={`${css.Text}`}>2FA</div>
              {qrCodeUrl && (
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "white",
                    display: "inline-block",
                    borderRadius: "10px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <QRCode value={qrCodeUrl} size={128} className="mx-auto" />
                </div>
              )}
              <h1 className={`${css.Text} m-4`}>
                Scan this code with GOOGLE AUTHENTICATOR
              </h1>
              <button onClick={codeScanned}>I have scanned the code</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Auth2fa;
