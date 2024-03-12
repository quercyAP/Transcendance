import type { ParamSvgRef } from "./ParamSvg";
import css from "../../styles/NavBar.module.css";
import ParamSvg from "./ParamSvg";
import { gsap } from "gsap";
import { useRef } from "react";

const UserButton = () => {
    const buttonRef = useRef(null);
    const extRef = useRef(null);
    const intRef = useRef(null);
    
    let tl = gsap.timeline();

    const handleHover = (ref: ParamSvgRef) => {
        if (!tl.isActive()) {
            tl = gsap.timeline();
            tl.to(ref.extRef.current, {
                rotation: 90,
                transformOrigin: "center",
                yoyo: true,
                repeat: 1,
                duration: 0.5,
                ease: "power1.inOut"
            }).to(ref.intRef.current, {
                rotation: -90,
                transformOrigin: "center",
                yoyo: true,
                repeat: 1,
                duration: 0.3,
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
    };

    return (
        <button ref={buttonRef} className={`${css.NavButton}`}
            onMouseEnter={() => handleHover({ extRef, intRef })}
            onClick={handleClick}
        >
            <ParamSvg extRef={extRef} intRef={intRef} />
        </button>
    );
};

export default UserButton;