import styles from "./Icon.module.css";

export default function TimelineIcon({ isActive }: { isActive?: boolean }) {
  return (
    <svg
      className={`${styles.icon} ${isActive ? styles.active : styles.inActive}`}
      viewBox="0 0 48.000000 48.000000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="translate(0.000000,48.000000) scale(0.100000,-0.100000)"
        stroke="none"
      >
        <path d="M160 467 c-49 -16 -133 -102 -148 -153 -28 -94 -8 -169 63 -239 90 -91 216 -101 307 -24 46 38 32 44 -20 9 -111 -74 -257 -36 -316 82 -28 55 -32 101 -16 157 22 79 96 145 176 157 24 3 44 10 44 15 0 12 -46 10 -90 -4z" />
        <path d="M300 461 c0 -11 39 -26 47 -17 8 8 3 12 -24 20 -13 4 -23 3 -23 -3z" />
        <path d="M400 404 c0 -17 28 -49 36 -41 4 4 -2 17 -14 30 -12 12 -22 17 -22 11z" />
        <path d="M230 287 c0 -51 2 -55 55 -107 30 -29 58 -51 62 -47 4 4 -17 31 -45 60 -48 48 -52 56 -52 100 0 26 -4 47 -10 47 -5 0 -10 -24 -10 -53z" />
        <path d="M457 275 c3 -14 10 -25 15 -25 13 0 6 43 -8 47 -7 2 -10 -6 -7 -22z" />
        <path d="M445 159 c-6 -19 0 -38 9 -28 10 12 16 49 7 49 -5 0 -13 -9 -16 -21z" />
      </g>
    </svg>
  );
}
