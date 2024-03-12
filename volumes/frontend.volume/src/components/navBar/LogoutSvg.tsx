import React, { MutableRefObject } from "react";

export type LogoutSvgRef = {
    arrowRef: MutableRefObject<SVGPathElement | null>;
}

const LogoutSvg = (ref: LogoutSvgRef) => {
    return (
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px"
            y="0px" width="100%" viewBox="0 0 512 512" >
            <defs>
                <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
                    <feFlood result="flood" floodColor="#00a6ff" floodOpacity="1"></feFlood>
                    <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"></feComposite>
                    <feGaussianBlur stdDeviation="200" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g filter="url(#glow-effect)">
                <path transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none" d="M2275 4675 c-682 -96 -1263 -488 -1591 -1074 -55 -99 -58 -107 -58
-172 1 -56 6 -76 31 -120 39 -69 92 -99 175 -99 99 0 152 37 206 146 45 89
160 257 240 348 174 199 443 383 687 470 225 79 348 100 590 100 167 0 206 -4
316 -27 301 -63 570 -198 799 -401 275 -243 472 -584 550 -951 34 -157 39
-441 11 -604 -65 -381 -281 -774 -559 -1017 -627 -548 -1549 -560 -2204 -27
-158 129 -327 331 -428 515 -49 88 -84 120 -153 139 -90 24 -199 -26 -245
-111 -38 -72 -29 -123 47 -257 288 -507 780 -883 1347 -1028 326 -84 696 -88
1009 -11 623 154 1170 604 1436 1184 129 282 188 530 196 838 8 286 -22 491
-109 742 -253 736 -862 1256 -1643 1403 -145 28 -501 35 -650 14z" />
                <path ref={ref.arrowRef} transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none"
                    d="M2286 3615 c-110 -39 -170 -142 -146 -249 12 -49 25 -64 276 -316
                 145 -146 264 -269 264 -273 0 -4 -473 -7 -1050 -7 -1143 0 -1076 3 -1138 -54
-84 -75 -84 -237 0 -312 62 -57 -5 -54 1138 -54 577 0 1050 -3 1050 -7 0 -4
-119 -127 -264 -273 -251 -252 -264 -267 -276 -316 -34 -150 104 -288 254
-254 50 12 65 26 523 483 463 461 473 472 484 523 9 40 9 64 -1 105 -12 53
-18 60 -479 522 -430 431 -470 469 -515 482 -60 18 -70 18 -120 0z" />
            </g>
        </svg>
    );
};

export default LogoutSvg;