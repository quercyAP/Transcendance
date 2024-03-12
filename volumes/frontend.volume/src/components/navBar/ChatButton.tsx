import type { PointRefObject, ChatSvgRef } from "./ChatSvg";
import css from "../../styles/NavBar.module.css";
import ChatSvg from "./ChatSvg";
import { gsap } from "gsap";
import { useRef } from "react";
import { useNavRef } from "../../context/navContext";

const ChatButton = () => {
    const {
        showChat, chatRoomRef, setShowChat,
        setChatRoomRect, setChatButtonRect
    } = useNavRef();

    const pointRef: PointRefObject = {
        a: useRef<SVGPathElement>(null),
        b: useRef<SVGPathElement>(null),
        c: useRef<SVGPathElement>(null),
    };

    const chatButtonRef = useRef<HTMLButtonElement>(null);
    const littleRef = useRef<SVGPathElement>(null);
    const bigRef = useRef<SVGPathElement>(null);

    let tlHover = gsap.timeline();

    const handleHover = (ref: ChatSvgRef) => {
        if (!tlHover.isActive()) {
            tlHover = gsap.timeline();
            tlHover.fromTo(ref.littleRef.current,
                { scale: 0, transformOrigin: "100% 0%" },
                {
                    scaleY: -0.1,
                    scale: 0.1,
                    duration: 0.2,
                    ease: "power1.in"
                }).fromTo(ref.bigRef.current,
                    { scale: 0, transformOrigin: "0% 0%" },
                    {
                        scaleY: -0.1,
                        scale: 0.1,
                        duration: 0.2,
                        ease: "power1.in"
                    }, 0.1).fromTo(ref.pointRef.a.current,
                        { scale: 0, transformOrigin: "center" },
                        {
                            scale: 1,
                            duration: 0.2,
                            ease: "power1.in"
                        }, 0.3).fromTo(ref.pointRef.b.current,
                            { scale: 0, transformOrigin: "center" },
                            {
                                scale: 1,
                                duration: 0.2,
                                ease: "power1.in"
                            }, 0.4).fromTo(ref.pointRef.c.current,
                                { scale: 0, transformOrigin: "center" },
                                {
                                    scale: 1,
                                    duration: 0.2,
                                    ease: "power1.in"
                                }, 0.5);
        }
    };

    let tlClick = gsap.timeline();

    const handleClick = () => {
        gsap.fromTo(chatButtonRef.current,
            { scale: 0.8 },
            {
                scale: 1,
                duration: 0.5,
                ease: "bounce.out"
            });

        if (chatRoomRef.current && chatButtonRef.current) {
            const buttonRect = chatButtonRef.current.getBoundingClientRect();
            setChatButtonRect(buttonRect);
            const chatRoomRect = chatRoomRef.current.getBoundingClientRect();
            setChatRoomRect(chatRoomRect);

            const xMove = buttonRect.left - chatRoomRect.left - chatRoomRect.width / 2;
            const yMove = buttonRect.top - chatRoomRect.top - chatRoomRect.height / 2;

            if (!tlClick.isActive()) {
                tlClick = gsap.timeline();

                tlClick.to(chatRoomRef.current, {
                    x: "+=" + xMove,
                    y: "+=" + yMove,
                    scale: 0,
                    duration: 0.3,
                    ease: "power2.in",
                    onComplete: () => setShowChat(!showChat)
                });
            }
        } else {
            setShowChat(!showChat);
        }
    }

    return (
        <button ref={chatButtonRef} className={`${css.NavButton}`}
            onMouseEnter={() => handleHover({ pointRef, littleRef, bigRef })}
            onClick={handleClick}>
            <ChatSvg pointRef={pointRef} littleRef={littleRef} bigRef={bigRef} />
        </button>
    );
};

export default ChatButton;