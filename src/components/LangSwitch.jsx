import { LANGUAGES, useI18n } from '../i18n';
import styles from './LangSwitch.module.css';

/** UA / EN segmented switch. The active pill slides between the two options. */
export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  const index = Math.max(0, LANGUAGES.findIndex((l) => l.id === lang));

  return (
    <div className={styles.switch} role="group" aria-label={t('lang.label')} style={{ '--index': index }}>
      <span className={styles.thumb} aria-hidden="true" />
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          className={`${styles.option} ${l.id === lang ? styles.active : ''}`}
          aria-pressed={l.id === lang}
          title={l.name}
          onClick={() => setLang(l.id)}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
