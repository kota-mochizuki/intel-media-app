import { useState } from 'react';
import { clearDevice, fetchIds, isDemo, loadConfig, saveConfig } from '../lib/data';

export function Settings({ onSaved }: { onSaved: () => void }) {
  const [c, setC] = useState(loadConfig);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const test = async () => {
    setBusy(true); setMsg(null);
    saveConfig({ ...c, token: c.token.trim() });
    try {
      const ids = await fetchIds();
      setMsg({ ok: true, text: `つながりました。配信は${ids.length}本あります。` });
      onSaved();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setBusy(false);
  };

  return (
    <div className="settings">
      <a className="back" href="#/">← 今日にもどる</a>
      <h1 className="page-title">設定</h1>
      {isDemo() && <p className="gentle">いまは見本データ（demo）を表示しています。</p>}

      <section className="card">
        <h2 className="sub">配信の置き場につなぐ</h2>
        <p className="small">配信と反応は、あなただけが見られる非公開のリポジトリに保存されます。このアプリ自体には、配信の中身は入っていません。</p>
        <label className="field"><span>トークン</span>
          <input type="password" autoComplete="off" spellCheck={false} placeholder="github_pat_…" value={c.token} onChange={(e) => setC({ ...c, token: e.target.value })} />
        </label>
        <details className="fold">
          <summary>リポジトリ名を変える</summary>
          <label className="field"><span>持ち主</span><input value={c.owner} onChange={(e) => setC({ ...c, owner: e.target.value })} /></label>
          <label className="field"><span>リポジトリ</span><input value={c.repo} onChange={(e) => setC({ ...c, repo: e.target.value })} /></label>
        </details>
        <button className="btn" disabled={busy || !c.token.trim()} onClick={test}>{busy ? '確かめています…' : '保存して、つながるか確かめる'}</button>
        {msg && <p className={msg.ok ? 'ok' : 'warn'}>{msg.text}</p>}
      </section>

      <section className="card">
        <h2 className="sub">トークンの作り方（1回だけ）</h2>
        <ol className="steps">
          <li>GitHub の Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token</li>
          <li>Repository access は <b>Only select repositories</b> で <b>{c.repo}</b> だけを選ぶ</li>
          <li>Permissions の <b>Contents</b> を <b>Read and write</b> にする（ほかは触らない）</li>
          <li>有効期限は1年など。できたトークンを上に貼る</li>
        </ol>
        <p className="small muted">トークンはこの端末の中だけに保存されます。なくしたり心配になったら、GitHub で無効にして作り直せば大丈夫です。</p>
      </section>

      <section className="card">
        <h2 className="sub">この端末のデータ</h2>
        <p className="small">トークンと、読み込んだ配信の控えを、この端末から消します。送信済みの反応は消えません。</p>
        <button className="btn btn-quiet" onClick={() => { if (confirm('この端末のデータを消しますか？')) { clearDevice(); location.hash = '#/'; location.reload(); } }}>この端末のデータを消す</button>
      </section>
    </div>
  );
}
