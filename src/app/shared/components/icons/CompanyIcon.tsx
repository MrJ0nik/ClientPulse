import styles from "./Icon.module.css";

export default function CompanyIcon({ isActive }: { isActive?: boolean }) {
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
        <path d="M14 457 c-2 -8 -4 -52 -2 -98 l3 -84 95 0 95 0 0 95 0 95 -93 3 c-71 2 -94 0 -98 -11z m176 -87 l0 -80 -80 0 -80 0 0 80 0 80 80 0 80 0 0 -80z" />
        <path d="M274 457 c-2 -8 -4 -52 -2 -98 l3 -84 95 0 95 0 0 95 0 95 -93 3 c-71 2 -94 0 -98 -11z m176 -87 l0 -80 -80 0 -80 0 0 80 0 80 80 0 80 0 0 -80z" />
        <path d="M14 197 c-2 -8 -4 -52 -2 -98 l3 -84 95 0 95 0 0 95 0 95 -93 3 c-71 2 -94 0 -98 -11z m176 -87 l0 -80 -80 0 -80 0 0 80 0 80 80 0 80 0 0 -80z" />
        <path d="M274 197 c-2 -8 -4 -52 -2 -98 l3 -84 95 0 95 0 0 95 0 95 -93 3 c-71 2 -94 0 -98 -11z m176 -87 l0 -80 -80 0 -80 0 0 80 0 80 80 0 80 0 0 -80z" />
      </g>
    </svg>
  );
}
