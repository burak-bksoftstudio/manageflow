import { useEffect, useMemo, useState } from 'react';
import {
  Activity, CalendarDays, ChevronLeft, ChevronRight, CircleAlert, Clock3, FolderKanban,
  History, LoaderCircle, RefreshCw, TimerReset, UsersRound,
} from 'lucide-react';
import { useTeamTimesheet } from '../features/time-tracking/useTeamTimesheet';
import {
  formatCompactDuration, formatTimeEntryDate, formatTimeEntryRange, formatWeekRange, getRangeSeconds,
  getTeamTimesheetSummary, getWeekBounds,
} from '../features/time-tracking/timeTrackingUtils';
import { Avatar } from './Brand';

function TeamTimeStat({ icon: Icon, helper, label, value }) {
  return <article className="time-stat"><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

export default function TeamTimesheet({ projects }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [filters, setFilters] = useState({ memberId: '', projectId: '' });
  const [now, setNow] = useState(() => new Date());
  const selectedWeek = useMemo(() => {
    const { start } = getWeekBounds(now);
    start.setDate(start.getDate() + weekOffset * 7);
    return start;
  }, [now, weekOffset]);
  const rangeEnd = useMemo(() => {
    const end = new Date(selectedWeek);
    end.setDate(end.getDate() + 7);
    return end;
  }, [selectedWeek]);
  const {
    entries, error, loading, members, refresh,
  } = useTeamTimesheet({ enabled: true, rangeEnd, rangeStart: selectedWeek });
  const summary = useMemo(
    () => getTeamTimesheetSummary(entries, selectedWeek, rangeEnd, filters, now),
    [entries, filters, now, rangeEnd, selectedWeek],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
      refresh();
    }, 60000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const updateFilter = event => {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
  };

  return (
    <div className="team-timesheet-view">
      <section className="time-stats-grid team-timesheet-stats">
        <TeamTimeStat icon={Clock3} label="TOPLAM SÜRE" value={formatCompactDuration(summary.totalSeconds)} helper="Seçili haftanın ekip toplamı" />
        <TeamTimeStat icon={TimerReset} label="KAYIT" value={summary.sessions} helper="Filtreye uyan oturumlar" />
        <TeamTimeStat icon={UsersRound} label="EKİP ÜYESİ" value={summary.members} helper="Süre girişi bulunan kişiler" />
        <TeamTimeStat icon={FolderKanban} label="PROJE" value={summary.projects} helper="Üzerinde çalışılan işler" />
      </section>

      <section className="team-timesheet-card">
        <header>
          <div><span><UsersRound /></span><div><small>YÖNETİCİ RAPORU</small><h2>Haftalık ekip zaman dökümü</h2><p>Arşivlenmemiş kayıtlar, çalışma alanı ve rol sınırları içinde gösterilir.</p></div></div>
          <strong>{formatCompactDuration(summary.totalSeconds)}</strong>
        </header>
        <div className="team-timesheet-toolbar">
          <div className="time-week-nav"><button onClick={() => setWeekOffset(value => value - 1)} aria-label="Önceki hafta"><ChevronLeft /></button><button className="week-label" onClick={() => setWeekOffset(0)}><CalendarDays />{weekOffset === 0 ? 'Bu hafta' : formatWeekRange(selectedWeek)}</button><button onClick={() => setWeekOffset(value => value + 1)} disabled={weekOffset >= 0} aria-label="Sonraki hafta"><ChevronRight /></button></div>
          <select name="memberId" value={filters.memberId} onChange={updateFilter} aria-label="Ekip zamanlarını üyeye göre filtrele"><option value="">Tüm ekip üyeleri</option>{members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
          <select name="projectId" value={filters.projectId} onChange={updateFilter} aria-label="Ekip zamanlarını projeye göre filtrele"><option value="">Tüm projeler</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
        </div>

        {error && <div className="team-timesheet-error" role="alert"><CircleAlert /><span><b>Ekip raporu yüklenemedi</b><small>Yetkinizi ve bağlantınızı kontrol edip yeniden deneyin.</small></span><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
        {loading && <div className="team-timesheet-state" role="status"><LoaderCircle className="spin" /><span>Ekip zamanları hazırlanıyor…</span></div>}

        {!loading && !error && (
          <div className="team-timesheet-list">
            {summary.entries.map(entry => {
              const member = members.find(item => item.id === entry.userId);
              return (
                <article key={entry.id}>
                  <span className="team-timesheet-member"><Avatar initials={member?.initials || 'MF'} imageUrl={entry.memberAvatarUrl || member?.avatarUrl} /><span><b>{entry.memberName}</b><small>{entry.memberEmail}</small></span></span>
                  <span className="team-timesheet-context"><b>{entry.taskTitle || entry.projectName}{entry.entryType === 'manual' && <em className="time-manual-tag">Manuel</em>}{entry.correctedAt && <em className="time-corrected-tag">Düzeltildi</em>}{entry.isActive && <em className="team-time-active-tag"><Activity /> Aktif</em>}</b><small>{entry.taskTitle ? entry.projectName : 'Proje geneli'}</small>{entry.note && <p>{entry.note}</p>}</span>
                  <span className="team-timesheet-date"><CalendarDays /><b>{formatTimeEntryDate(entry)}</b><small>{formatTimeEntryRange(entry)}</small></span>
                  <strong>{formatCompactDuration(getRangeSeconds(entry, selectedWeek, rangeEnd, now))}</strong>
                </article>
              );
            })}
            {summary.entries.length === 0 && <div className="team-timesheet-empty"><History /><h3>Bu görünümde zaman kaydı yok</h3><p>Haftayı veya filtreleri değiştirin. Ekip süre girdikçe kayıtlar burada görünecek.</p></div>}
          </div>
        )}
      </section>
    </div>
  );
}
