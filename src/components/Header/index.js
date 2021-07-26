import './header.css'

const Logo = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="55px"
        height="14px"
        viewBox="0 0 50 13"
        version="1.1"
        style={{ marginRight: 10 }}
    >
        <defs>
            <linearGradient
                x1="50%"
                y1="0.810282939%"
                x2="50%"
                y2="100%"
                id="linearGradient-1"
            >
                <stop stop-color="#CC56F9" offset="0%" />
                <stop stop-color="#FF26CC" offset="100%" />
            </linearGradient>
        </defs>
        <g
            id="Page-1"
            stroke="none"
            stroke-width="1"
            fill="none"
            fill-rule="evenodd"
        >
            <g
                id="Artboard"
                transform="translate(-297.000000, -176.000000)"
                fill-rule="nonzero"
            >
                <g id="Group" transform="translate(297.000000, 176.000000)">
                    <path
                        d="M17.248,0.8 L20.8,0.8 C22.608,0.8 24.896,1.728 24.896,4.16 C24.896,5.904 23.712,6.864 22.464,7.28 C23.456,8.672 25.12,10.96 25.888,12 L23.008,12 L19.936,7.536 L19.536,7.536 L19.536,12 L17.248,12 L17.248,0.8 Z M19.536,2.736 L19.536,5.6 L20.432,5.6 C21.584,5.6 22.448,5.184 22.448,4.208 C22.448,3.328 21.76,2.736 20.736,2.736 L19.536,2.736 Z M29.68,12 L27.392,12 L27.392,0.8 L29.68,0.8 L29.68,12 Z M38.416,3.568 C37.792,3.04 36.96,2.56 36.096,2.56 C35.328,2.56 34.64,2.944 34.64,3.68 C34.64,4.544 35.696,4.784 36.56,5.088 C38.144,5.632 40.048,6.368 40.048,8.72 C40.048,11.152 37.76,12.192 35.808,12.192 C34.08,12.192 32.736,11.536 31.52,10.32 L33.04,8.832 C33.952,9.712 34.656,10.24 35.824,10.24 C36.72,10.24 37.6,9.808 37.6,8.816 C37.6,7.856 36.576,7.488 35.44,7.072 C33.984,6.528 32.352,5.888 32.352,3.744 C32.352,1.616 34.16,0.608 36.016,0.608 C37.456,0.608 38.592,1.072 39.728,1.936 L38.416,3.568 Z M49.104,12 L41.92,12 L41.92,0.8 L49.104,0.8 L49.104,2.736 L44.208,2.736 L44.208,5.264 L49.104,5.264 L49.104,7.2 L44.208,7.2 L44.208,10.064 L49.104,10.064 L49.104,12 Z"
                        id="RISE"
                        fill="#151515"
                    />
                    <circle
                        id="Oval"
                        fill="url(#linearGradient-1)"
                        cx="6.5"
                        cy="6.5"
                        r="6.5"
                    />
                </g>
            </g>
        </g>
    </svg>
)

export default function Header() {
    return (
        <div className="header-container">
            <div className="header-inner">
                <div className="logo-container">
                    <Logo /> <span> Editor</span>
                </div>
            </div>
        </div>
    )
}
