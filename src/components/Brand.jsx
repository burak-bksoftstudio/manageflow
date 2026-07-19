import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link className="brand" to="/dashboard" aria-label="ManageFlow ana sayfa">
      <svg className="brand-mark" viewBox="0 0 40 40" role="img" aria-hidden="true">
        <rect width="40" height="40" rx="12" />
        <path className="brand-m" d="M9.5 27.5V13l8.2 8.3 5.2-5.4" />
        <path className="brand-flow" d="M18.8 29.2 30.5 12.8M24.2 12.8h6.3v6.4" />
      </svg>
      <span className="brand-wordmark">Manage<span>Flow</span></span>
    </Link>
  );
}

export function Avatar({ small = false, initials = 'BE', imageUrl = '' }) {
  return <span className={`avatar ${small ? 'small' : ''}`}>{initials}{imageUrl && <img src={imageUrl} alt="" onError={event => event.currentTarget.remove()} />}</span>;
}
