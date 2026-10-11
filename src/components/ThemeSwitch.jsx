import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import styles from './ThemeSwitch.module.css';

/**
 * Day / night switch: a track with a knob that slides between a sun and a moon.
 * It's a real switch for assistive tech (role="switch", checked = night).
 */
export function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const dark = theme === 'dark';
  const label = dark ? t('theme.toLight') : t('theme.toDark');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t('theme.label')}
      title={label}
      className={`${styles.switch} ${dark ? styles.dark : ''}`}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`${styles.icon} ${styles.sun}`}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`${styles.icon} ${styles.moon}`}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      </svg>
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}
