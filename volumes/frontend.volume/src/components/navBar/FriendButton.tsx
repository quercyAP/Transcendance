import type { CircleRefObject, FriendSvgRef } from "./FriendSvg";
import css from "../../styles/NavBar.module.css";
import FriendSvg from "./FriendSvg";
import { gsap } from "gsap";
import { useRef } from "react";
import { useNavRef } from "../../context/navContext";

const FriendButton = () => {
    const { 
        friendButtonRef, friendsListRef, setShowFriendsList,
        showFriendsList, toggleMenu
    } = useNavRef();
    const circleRef: CircleRefObject = {
        a: useRef<SVGPathElement>(null),
        b: useRef<SVGPathElement>(null),
        c: useRef<SVGPathElement>(null),
    };
    const firstRef = useRef<SVGPathElement>(null);
    const secondRef = useRef<SVGPathElement>(null);
    const thirdRef = useRef<SVGPathElement>(null);

    let tlHover = gsap.timeline();

    const handleHover = (ref: FriendSvgRef) => {
        if (!tlHover.isActive()) {
            tlHover = gsap.timeline();
            tlHover.fromTo(ref.firstRef.current,
                { svgOrigin: "256 256", scale: 0 },
                {
                    duration: 0.3,
                    rotation: 540,
                    ease: "ease.out",
                    scale: 0.1,
                    onComplete: () => {
                        gsap.set(ref.firstRef.current, { rotation: 180 })
                    }
                }).fromTo(ref.secondRef.current,
                    { svgOrigin: "256 256", scale: 0 },
                    {
                        duration: 0.3,
                        rotation: 540,
                        scale: 0.1,
                        ease: "ease.out",
                        onComplete: () => {
                            gsap.set(ref.secondRef.current, { rotation: 180 })
                        }
                    }, 0.1).fromTo(ref.thirdRef.current,
                        { svgOrigin: "256 256", scale: 0 },
                        {
                            duration: 0.3,
                            rotation: 540,
                            scale: 0.1,
                            ease: "ease.out",
                            onComplete: () => {
                                gsap.set(ref.thirdRef.current, { rotation: 180 })
                            }
                        }, 0.15);
        }
    };

    const handleClick = () => {
        gsap.fromTo(friendButtonRef.current,
            { scale: 0.8 },
            {
                scale: 1,
                duration: 0.5,
                ease: "bounce.out"
        });
        if (friendsListRef.current) {
            toggleMenu({ref: friendsListRef, dispatch: setShowFriendsList, show: showFriendsList});
        } else {
            setShowFriendsList(!showFriendsList);
        }
    }

    return (
        <button ref={friendButtonRef} className={`${css.NavButton}`}
            onMouseEnter={() => handleHover({ circleRef, firstRef, secondRef, thirdRef })}
            onClick={handleClick}>
            <FriendSvg circleRef={circleRef} firstRef={firstRef} secondRef={secondRef} thirdRef={thirdRef} />
        </button>
    );
};

export default FriendButton;
