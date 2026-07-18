import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, Sparkles } from 'lucide-react';

export function PlaceholderPage({ page }) {
  return (
    <section className="placeholder-page">
      <div className="eyebrow"><i /> YAKINDA</div>
      <h1>{page}</h1>
      <p>Bu modül ManageFlow tasarım sistemiyle birlikte kullanıma hazırlanıyor.</p>
      <div className="placeholder-card">
        <Sparkles /><span className="coming-soon-badge">YAKINDA</span><h2>{page} üzerinde çalışıyoruz</h2>
        <p>Bu özellik geliştirme planımızda. Hazır olduğunda burada kullanabileceksiniz.</p>
        <button className="soft-button" disabled><Clock3 /> Geliştirme aşamasında</button>
      </div>
    </section>
  );
}

export function NotFoundPage() {
  return (
    <section className="placeholder-page">
      <div className="eyebrow"><i /> 404</div>
      <h1>Bu sayfa akışta yok.</h1>
      <p>Aradığınız sayfa taşınmış veya henüz oluşturulmamış olabilir.</p>
      <Link className="agenda-button" to="/dashboard"><ArrowLeft /> Dashboard'a dön</Link>
    </section>
  );
}
