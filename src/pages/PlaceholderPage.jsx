import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';

export function PlaceholderPage({ page }) {
  return (
    <section className="placeholder-page">
      <div className="eyebrow"><i /> ÇALIŞMA ALANI</div>
      <h1>{page}</h1>
      <p>Bu modül ManageFlow tasarım sistemiyle birlikte kullanıma hazırlanıyor.</p>
      <div className="placeholder-card">
        <Sparkles /><h2>{page} alanınız hazır</h2>
        <p>Yeni kayıt ekleyerek çalışma alanınızı oluşturmaya başlayın.</p>
        <button className="agenda-button"><Plus /> Yeni oluştur</button>
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
