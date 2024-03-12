import type { UserSvgRef } from "./UserSvg";
import css from "../../styles/NavBar.module.css";
import UserSvg from "./UserSvg";
import { gsap } from "gsap";
import { useRef } from "react";
import { useNavRef } from "../../context/navContext";

const UserButton = () => {
    const { 
        setShowProfile, showProfile, userButtonRef,
        profileRef, toggleMenu
    } = useNavRef();
    const headRef = useRef(null);
    const bodyRef = useRef(null);

    let tl = gsap.timeline();

    const handleHover = (ref: UserSvgRef) => {
        if (!tl.isActive()) {
            tl = gsap.timeline();
            tl.to(ref.headRef.current, {
                y: "20",
                yoyo: true,
                repeat: 1,
                duration: 0.1,
                delay: 0.1,
                ease: "power1.inOut"
            }).to(ref.bodyRef.current, {
                y: "-20",
                yoyo: true,
                repeat: 1,
                duration: 0.1,
                ease: "power1.inOut"
            }, 0);
        }
    };

    const handleClick = () => {
        gsap.fromTo(userButtonRef.current,
            { scale: 0.8 },
            {
                scale: 1,
                duration: 0.5,
                ease: "bounce.out"
            });
        if (profileRef.current) {
            toggleMenu({ref: profileRef, dispatch: setShowProfile, show: showProfile});
        } else {
            setShowProfile(!showProfile);
        }
    };

    return (
        <button ref={userButtonRef} className={`${css.NavButton}`}
            onMouseEnter={() => handleHover({ headRef, bodyRef })}
            onClick={handleClick}
        >
            <UserSvg headRef={headRef} bodyRef={bodyRef} />
        </button>
    );
};

export default UserButton;