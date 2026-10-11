import { useI18n } from '../i18n';
import styles from './CategoryTags.module.css';

/** Raw API category values, translated for display when a translation exists. */
export function CategoryTags({ categories, limit = Infinity, active }) {
  const { t, category } = useI18n();
  if (!categories?.length) return null;
  const visible = categories.slice(0, limit);
  const rest = categories.length - visible.length;

  return (
    <ul className={styles.tags} aria-label={t('card.categories')}>
      {visible.map((cat) => (
        <li key={cat} className={cat === active ? styles.match : undefined} title={cat}>
          {category(cat)}
        </li>
      ))}
      {rest > 0 && <li className={styles.more}>+{rest}</li>}
    </ul>
  );
}
