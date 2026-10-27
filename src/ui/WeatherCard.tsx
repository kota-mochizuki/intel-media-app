import { useEffect, useState } from 'react';
import * as store from '../lib/store';
import { todayJst } from '../lib/dates';
import { PLACE, cautions, dayProb, forecastUrl, parseForecast, type Wx } from '../lib/weather';

const KEY = 'imc:wx';

/** 朝の画面のいちばん上。今日の天気で注意が必要なときだけ出す（何もない日は出さない） */
export function WeatherCard() {
  const today = todayJst();
  const [wx, setWx] = useState<Wx | null>(() => { const c = store.get<Wx>(KEY); return c?.date === today ? c : null; });
  useEffect(() => {
    let off = false;
    fetch(forecastUrl(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { const w = j && parseForecast(j, today); if (!off && w) { setWx(w); store.set(KEY, w); } })
      .catch(() => { /* 電波がなければ控えのまま */ });
    return () => { off = true; };
  }, [today]);
  if (!wx) return null;
  const list = cautions(wx);
  if (!list.length) return null;
  return (
    <section className="card weather">
      <div className="label">今日の天気の注意（{PLACE.name}）</div>
      <ul className="wx-list">{list.map((c, i) => <li key={i} className={c.level === '警戒' ? 'wx-alert' : ''}>{c.text}</li>)}</ul>
      <p className="muted small">最高{Math.round(wx.max)}℃・最低{Math.round(wx.min)}℃・日中の降水確率{Math.round(dayProb(wx))}%　<a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></p>
    </section>
  );
}
