// İlk 11 düzenleyicisi: kadrodan (studio/veteran-kadro.ts) ilk 11 ve yedekler, ilk 11'den kaptan seçilir; kurallar
// canlı denetlenir. Safranboluspor panelindeki düzenleyicinin (veteran-lineup-editor.tsx) bu projedeki karşılığıdır.
import { useState } from "react";
import {
  MAX_STARTERS,
  MAX_SUBS,
  ROSTER,
  checkLineup,
  orderedPlayers,
  parseLineup,
  serializeLineup,
  type VeteranLineup,
  type VeteranPlayer,
} from "./studio/veteran-kadro";

export const VeteranLineupEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const lineup = parseLineup(value);
  const { starters, subs, captain } = lineup;
  const save = (next: Partial<VeteranLineup>) => onChange(serializeLineup({ ...lineup, ...next }));
  // Oyuncu listesi kapatılabilir (kadro kurulduktan sonra form kısalsın)
  const [listOpen, setListOpen] = useState(true);

  const starterSet = new Set(starters);
  const subSet = new Set(subs);
  const keeperInXI = starters.some((n) => ROSTER.find((p) => p.numara === n)?.kaleci);
  const checks = checkLineup(lineup);

  /** Oyuncuyu ilk 11'e / yedeklere eklemenin önündeki engel (yoksa null) */
  const starterBlock = (p: VeteranPlayer) => {
    if (starters.length >= MAX_STARTERS) return "İlk 11 dolu";
    if (p.kaleci && keeperInXI) return "İlk 11'de zaten bir kaleci var";
    return null;
  };
  const subBlock = () => (subs.length >= MAX_SUBS ? `Yedekler en fazla ${MAX_SUBS} kişi` : null);

  const toggleStarter = (p: VeteranPlayer) => {
    if (starterSet.has(p.numara)) {
      save({ starters: starters.filter((n) => n !== p.numara), captain: captain === p.numara ? "" : captain });
      return;
    }
    if (starterBlock(p)) return;
    save({ starters: [...starters, p.numara], subs: subs.filter((n) => n !== p.numara) });
  };
  const toggleSub = (p: VeteranPlayer) => {
    if (subSet.has(p.numara)) {
      save({ subs: subs.filter((n) => n !== p.numara) });
      return;
    }
    if (subBlock()) return;
    save({
      subs: [...subs, p.numara],
      starters: starters.filter((n) => n !== p.numara),
      captain: captain === p.numara ? "" : captain,
    });
  };

  return (
    <div className="lineup">
      <div className="field">
        <button
          type="button"
          className="lineup-head"
          onClick={() => setListOpen((o) => !o)}
          aria-expanded={listOpen}
          aria-controls="veteran-lineup-list"
        >
          <span className="label">
            <span className={listOpen ? "chevron" : "chevron closed"}>▾</span> Karabük Akademi oyuncuları
          </span>
          <span className="count">
            İlk 11 {starters.length}/{MAX_STARTERS} · Yedek {subs.length}/{MAX_SUBS}
          </span>
        </button>
        <div id="veteran-lineup-list" className="lineup-list" hidden={!listOpen}>
          {ROSTER.map((p) => {
            const inXI = starterSet.has(p.numara);
            const onBench = subSet.has(p.numara);
            const xiBlock = inXI ? null : starterBlock(p);
            const benchBlock = onBench ? null : subBlock();
            return (
              <div key={p.numara} className={`lineup-row${inXI ? " xi" : onBench ? " bench" : ""}`}>
                <span className="no">{p.numara}</span>
                <span className="name">
                  {p.ad}
                  {p.kaleci && <span className="badge">Kaleci</span>}
                </span>
                <button
                  type="button"
                  className={`pick${inXI ? " on" : ""}`}
                  onClick={() => toggleStarter(p)}
                  disabled={!!xiBlock}
                  title={xiBlock ?? undefined}
                >
                  İlk 11
                </button>
                <button
                  type="button"
                  className={`pick bench${onBench ? " on" : ""}`}
                  onClick={() => toggleSub(p)}
                  disabled={!!benchBlock}
                  title={benchBlock ?? undefined}
                >
                  Yedek
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <label className="field">
        <span className="label">Kaptan</span>
        <select
          value={starterSet.has(captain) ? captain : ""}
          onChange={(e) => save({ captain: e.target.value })}
          disabled={!starters.length}
        >
          <option value="">{starters.length ? "Kaptan seçin" : "Önce ilk 11'i seçin"}</option>
          {orderedPlayers(starters).map((p) => (
            <option key={p.numara} value={p.numara}>
              {p.numara} · {p.ad}
            </option>
          ))}
        </select>
        <span className="hint">Adının yanına “C” eklenir.</span>
      </label>

      <div className="field">
        <span className="label">Kadro kuralları</span>
        <ul className="rules">
          {checks.map((c) => (
            <li key={c.label}>
              <span className={c.ok ? "mark ok" : "mark"}>{c.ok ? "✓" : "×"}</span>
              <span>
                <strong>{c.label}</strong>
                <span className="hint"> · {c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
