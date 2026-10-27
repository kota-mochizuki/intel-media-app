// 今日の天気で、注意が必要なときだけ知らせる。予報は Open-Meteo（鍵不要・CC BY 4.0）から読む。
// 場所は自宅（杉並区）。引っ越したら PLACE を直す。

export const PLACE = { name: '杉並区', lat: 35.6995, lon: 139.6364 };

export interface Wx {
  date: string; code: number; max: number; min: number; prevMax: number | null;
  rainSum: number; rainProb: number; gust: number;
  hourlyProb: { hour: number; p: number }[]; // その日の時間ごとの降水確率
}
export interface Caution { level: '注意' | '警戒'; text: string }

export const forecastUrl = () =>
  `https://api.open-meteo.com/v1/forecast?latitude=${PLACE.lat}&longitude=${PLACE.lon}` +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max' +
  '&hourly=precipitation_probability&timezone=Asia%2FTokyo&past_days=1&forecast_days=1&wind_speed_unit=ms';

/** Open-Meteo の返事から、今日の分を取り出す */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseForecast(j: any, today: string): Wx | null {
  const d = j?.daily;
  const i = d?.time?.indexOf(today) ?? -1;
  if (i < 0) return null;
  const hourlyProb: Wx['hourlyProb'] = [];
  (j.hourly?.time ?? []).forEach((t: string, k: number) => {
    if (t.startsWith(today)) hourlyProb.push({ hour: Number(t.slice(11, 13)), p: j.hourly.precipitation_probability[k] ?? 0 });
  });
  return {
    date: today, code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i],
    prevMax: i > 0 ? d.temperature_2m_max[i - 1] : null,
    rainSum: d.precipitation_sum[i] ?? 0, rainProb: d.precipitation_probability_max[i] ?? 0, gust: d.wind_gusts_10m_max[i] ?? 0,
    hourlyProb,
  };
}

const r = (n: number) => Math.round(n);

/** 外出の時間帯（6〜22時）の降水確率の最大。時間ごとの値がなければ1日の最大 */
export const dayProb = (w: Wx) => {
  const h = w.hourlyProb.filter((x) => x.hour >= 6 && x.hour <= 22);
  return h.length ? Math.max(...h.map((x) => x.p)) : w.rainProb;
};

/** 注意が必要なことだけを返す（何もなければ空） */
export function cautions(w: Wx): Caution[] {
  const out: Caution[] = [];
  // 雨・雪・雷
  if (w.code >= 95) out.push({ level: '警戒', text: '雷雨の予報。外出の時間に気をつけて' });
  if ((w.code >= 71 && w.code <= 77) || w.code === 85 || w.code === 86) out.push({ level: '警戒', text: '雪の予報。足もとと交通の乱れに注意' });
  if (w.rainSum >= 30) out.push({ level: '警戒', text: `大雨の予報（1日で${r(w.rainSum)}mm）。移動に余裕を` });
  else {
    // 深夜だけの雨で傘を勧めないよう、外出の時間帯（6〜22時）の降水確率で見る。雨量がほぼ0の日は確率70%以上のときだけ
    const p = dayProb(w);
    if ((w.rainSum >= 1 && p >= 30) || (p >= 50 && w.rainSum >= 0.5) || p >= 70) {
      const from = w.hourlyProb.find((h) => h.hour >= 6 && h.hour <= 22 && h.p >= 50)?.hour;
      out.push({ level: '注意', text: `傘を持って出かけましょう（日中の降水確率${r(p)}%${from !== undefined ? `、${from}時ごろから` : ''}）` });
    }
  }
  // 風
  if (w.gust >= 20) out.push({ level: '警戒', text: `非常に強い風（最大瞬間${r(w.gust)}m/s）` });
  else if (w.gust >= 15) out.push({ level: '注意', text: `強い風（最大瞬間${r(w.gust)}m/s）。傘が壊れやすい風です` });
  // 暑さ・寒さ
  if (w.max >= 35) out.push({ level: '警戒', text: `猛暑日（最高${r(w.max)}℃）。熱中症に警戒` });
  else if (w.max >= 30) out.push({ level: '注意', text: `真夏日（最高${r(w.max)}℃）。水分をこまめに` });
  if (w.min <= 0) out.push({ level: '注意', text: `氷点下の冷え込み（最低${r(w.min)}℃）。路面の凍結に注意` });
  else if (w.min <= 3) out.push({ level: '注意', text: `冷え込みます（最低${r(w.min)}℃）。朝晩は厚着を` });
  // 寒暖差
  if (w.prevMax !== null && Math.abs(w.max - w.prevMax) >= 6) {
    const d = r(w.max - w.prevMax);
    out.push({ level: '注意', text: `昨日より最高気温が${Math.abs(d)}℃${d > 0 ? '高い' : '低い'}（${r(w.max)}℃）。服装の調整を` });
  }
  return out;
}
