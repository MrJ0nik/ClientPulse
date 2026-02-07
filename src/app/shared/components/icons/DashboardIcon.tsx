import styles from './Icon.module.css';

export default function DashboardIcon({ isActive }: { isActive?: boolean }) {
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
        <path d="M115 340 c-65 -65 -116 -122 -112 -126 4 -4 18 3 32 16 l24 23 3 -124 3 -124 175 0 175 0 3 124 3 124 24 -23 c14 -13 28 -20 32 -16 6 6 -224 246 -237 246 -3 0 -59 -54 -125 -120z m207 13 l78 -78 0 -127 0 -128 -45 0 -44 0 -3 78 -3 77 -65 0 -65 0 -3 -77 -3 -78 -44 0 -45 0 0 127 0 128 77 77 c43 43 80 78 83 78 2 0 40 -35 82 -77z m-32 -263 l0 -70 -50 0 -50 0 0 70 0 70 50 0 50 0 0 -70z" />
      </g>
    </svg>
  );
}
