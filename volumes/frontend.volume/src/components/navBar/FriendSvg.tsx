import React, { MutableRefObject } from "react";

export type CircleRefObject = {
    a: MutableRefObject<SVGPathElement | null>;
    b: MutableRefObject<SVGPathElement | null>;
    c: MutableRefObject<SVGPathElement | null>;
}

export type FriendSvgRef = {
    circleRef: CircleRefObject;
    firstRef: MutableRefObject<SVGPathElement | null>;
    secondRef: MutableRefObject<SVGPathElement | null>;
    thirdRef: MutableRefObject<SVGPathElement | null>;
}

const FriendSvg = (ref: FriendSvgRef) => {
    return (
        <svg version="1.0" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
            width="100%" viewBox="0 0 512.000000 512.000000">
            <defs>
                <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
                    <feFlood result="flood" floodColor="#00a6ff" floodOpacity="1"></feFlood>
                    <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"></feComposite>
                    <feGaussianBlur stdDeviation="50" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g filter="url(#glow-effect)">
                <path ref={ref.firstRef} transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                fill="#ffffff" stroke="none" filter="url(#glow-effect)" d="M2418 4911 c-148 -48 -274 -179 -312 -326 -41 -157 -1 -323 105 -439
l46 -50 -76 -38 c-200 -100 -350 -269 -426 -478 -44 -124 -23 -224 64 -303 74
-67 74 -67 741 -67 667 0 667 0 741 67 87 79 108 179 64 303 -76 209 -229 381
-426 478 l-76 38 46 50 c106 116 146 282 105 439 -38 149 -165 279 -315 326
-79 25 -203 24 -281 0z m257 -162 c205 -77 261 -351 104 -508 -65 -65 -119
-86 -219 -86 -100 0 -154 21 -219 86 -57 58 -85 120 -89 204 -12 227 207 385
423 304z m60 -784 c152 -39 309 -149 397 -279 47 -68 97 -179 98 -214 0 -35
-25 -77 -55 -90 -19 -9 -180 -12 -616 -12 -647 0 -634 -1 -659 59 -17 42 -7
86 43 184 73 144 224 277 379 333 121 44 284 52 413 19z"/>
                <path ref={ref.circleRef.a} transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                fill="#ffffff" stroke="none" filter="url(#glow-effect)" d="M1428 3941 c-375 -252 -652 -604 -798 -1017 -39 -111 -90 -317 -90
-365 0 -45 33 -79 77 -79 54 0 70 24 98 154 109 493 387 897 809 1178 50 33
97 68 104 76 19 24 15 79 -8 102 -37 37 -79 27 -192 -49z"/>
                <path ref={ref.circleRef.b} transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                fill="#ffffff" stroke="none" filter="url(#glow-effect)" d="M3500 3990 c-23 -23 -27 -78 -7 -102 6 -8 53 -42 102 -75 423 -282
701 -686 810 -1179 29 -131 44 -154 99 -154 43 0 76 35 76 81 0 19 -13 88 -29
154 -69 282 -185 528 -356 753 -146 193 -297 335 -503 473 -113 76 -155 86
-192 49z"/>
                <path ref={ref.thirdRef} transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                fill="#ffffff" stroke="none" filter="url(#glow-effect)" d="M785 2240 c-204 -33 -362 -190 -396 -396 -22 -134 24 -284 117 -384
26 -28 45 -52 43 -53 -2 -2 -33 -17 -69 -35 -183 -88 -340 -256 -417 -447 -39
-96 -44 -185 -14 -250 23 -51 96 -118 147 -136 58 -21 1260 -21 1318 0 51 18
124 85 147 136 88 193 -141 562 -436 701 -33 16 -62 30 -64 31 -2 2 17 25 43
53 94 100 139 248 117 382 -41 258 -284 438 -536 398z m200 -185 c109 -49 179
-158 180 -280 0 -60 -5 -80 -33 -137 -57 -116 -147 -172 -277 -172 -130 0
-220 56 -277 171 -129 263 140 540 407 418z m13 -771 c44 -9 117 -35 171 -61
78 -37 109 -59 177 -127 67 -68 90 -99 128 -177 67 -138 61 -206 -22 -229 -23
-6 -242 -10 -597 -10 -355 0 -574 4 -597 10 -82 23 -89 91 -24 225 139 283
449 433 764 369z"/>
                <path ref={ref.secondRef} transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                fill="#ffffff" stroke="none" filter="url(#glow-effect)" d="M4195 2240 c-205 -33 -363 -191 -396 -398 -22 -135 23 -281 117 -382
26 -28 45 -52 43 -54 -2 -2 -26 -13 -52 -25 -296 -129 -538 -510 -448 -706 23
-51 96 -118 147 -136 58 -21 1260 -21 1318 0 51 18 124 85 147 136 88 192
-141 562 -431 698 -36 17 -67 32 -69 33 -2 2 17 26 43 54 93 100 139 250 117
384 -43 257 -284 436 -536 396z m200 -185 c110 -49 179 -158 179 -281 0 -60
-5 -81 -32 -137 -57 -115 -147 -171 -277 -171 -130 0 -220 56 -277 172 -28 57
-33 77 -33 137 2 228 232 375 440 280z m13 -771 c44 -9 117 -35 172 -61 79
-38 108 -59 175 -127 65 -66 91 -101 128 -177 68 -137 62 -205 -21 -229 -23
-6 -242 -10 -597 -10 -355 0 -574 4 -597 10 -84 24 -90 94 -21 231 38 77 62
109 129 176 68 67 100 90 176 127 151 73 298 92 456 60z"/>
                <path ref={ref.circleRef.c} transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                fill="#ffffff" stroke="none" filter="url(#glow-effect)" d="M1807 460 c-33 -26 -41 -63 -23 -98 18 -35 79 -60 263 -108 307 -79
639 -86 953 -19 88 18 264 71 301 91 56 29 58 104 4 140 -25 16 -30 16 -158
-24 -223 -70 -360 -92 -584 -92 -235 0 -422 32 -647 110 -73 25 -77 25 -109 0z"/>
            </g>
        </svg>

    );
};

export default FriendSvg;