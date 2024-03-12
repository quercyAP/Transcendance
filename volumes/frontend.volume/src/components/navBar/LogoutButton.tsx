import type { LogoutSvgRef } from "./LogoutSvg";
import css from "../../styles/NavBar.module.css";
import LogoutSvg from "./LogoutSvg";
import { gsap } from "gsap";
import { useRef } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useNavRef } from "../../context/navContext";
import { Socket } from "socket.io-client";

const LogoutButton = ({socket}: {socket: Socket | undefined}) => {
    const router = useRouter();
    const buttonRef = useRef(null);
    const arrowRef = useRef(null);
    const {
      setIsLoggedIn
    } = useNavRef();

    let tl = gsap.timeline();

    const handleHover = (ref: LogoutSvgRef) => {
        if (!tl.isActive()) {
            tl = gsap.timeline();
            tl.to(ref.arrowRef.current, {
                x: "-50",
                yoyo: true,
                repeat: 1,
                duration: 0.1,
                delay: 0.1,
                ease: "power1.inOut"
            }, 0);
        }
    };

    const handleClick = () => {
        gsap.fromTo(buttonRef.current,
            { scale: 0.8 },
            {
                scale: 1,
                duration: 0.5,
                ease: "bounce.out"
            });
            handleLogout();
    };

    const handleLogout = async () => {
        const baseUrl = process.env.REVERSE_PROXY_URL;
        const url = new URL("/api/auth/signout", baseUrl).href;
        try {
          const response = await fetch(url, { method: "POST" });
          if (response.ok) {
            socket?.disconnect();
            setIsLoggedIn(false);
            router.push("/login");
          } else {
            console.error("Failed to logout:", response);
          }
        } catch (error) {
          console.log("Logout error:", error);
        }
      };

    return (
        <button ref={buttonRef} className={`${css.NavButton}`}
            onMouseEnter={() => handleHover({ arrowRef })}
            onClick={handleClick}
        >
            <LogoutSvg arrowRef={arrowRef} />
        </button>
    );
};

export default LogoutButton;
