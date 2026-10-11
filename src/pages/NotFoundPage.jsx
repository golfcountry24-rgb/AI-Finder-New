import { Link } from 'react-router-dom';
import { EmptyState } from '../components/StateViews';
import { useI18n } from '../i18n';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
      <EmptyState
        as="h1"
        title={t('notFound.title')}
        action={
          <Link className="btn" to="/">
            {t('notFound.back')}
          </Link>
        }
      >
        {t('notFound.text')}
      </EmptyState>
    </div>
  );
}
