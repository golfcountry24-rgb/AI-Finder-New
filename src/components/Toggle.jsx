import styles from './Toggle.module.css';

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className={styles.toggle} title={hint}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.track} aria-hidden="true" />
      <span className={styles.text}>{label}</span>
    </label>
  );
}
