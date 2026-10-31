// İlk 11 düzenleyicisi: kadrodan (studio/veteran-kadro.ts) ilk 11 ve yedekler, ilk 11'den kaptan seçilir; kurallar
// canlı denetlenir.
import { useState } from "react";
import { Dropdown } from "./Dropdown";
import {
  MAX_STARTERS,
  MAX_SUBS,
  MAX_YOUTH_STARTERS,
  ROSTER,
  checkLineup,
  orderedPlayers,
  parseLineup,
  serializeLineup,
  shirtNumber,
  type VeteranLineup,
  type VeteranPlayer,
} from "./studio/veteran-kadro";

export const VeteranLineupEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const lineup = parseLineup(value);
  const { starters, subs, captain, numbers } = lineup;
  const save = (next: Partial<VeteranLineup>) => onChange(serializeLineup({ ...lineup, ...next }));
  // Oyuncu listesi kapatılabilir (kadro kurulduktan sonra form kısalsın)
  const [listOpen, setListOpen] = useState(true);

  const starterSet = new Set(starters);
  const subSet = new Set(subs);
  const keeperInXI = starters.some((n) => ROSTER.find((p) => p.numara === n)?.kaleci);
  const youthInXI = starters.filter((n) => ROSTER.find((p) => p.numara === n)?.genc).length;
  const checks = checkLineup(lineup);

  /** Oyuncu ilk 11'den çıkınca elle girilmiş forma numarası da silinir */
  const withoutNumber = (id: string) => Object.fromEntries(Object.entries(numbers).filter(([k]) => k !== id));
  const setNumber = (p: VeteranPlayer, raw: string) => {
    const n = raw.replace(/\D/g, "").slice(0, 2);
    save({ numbers: n && n !== p.numara ? { ...numbers, [p.numara]: n } : withoutNumber(p.numara) });
  };
  /** Forma numarası önerileri: kadrodaki numarası önce, sonra ilk 11'de başkasının kullanmadığı numaralar */
  const numberSuggestions = (p: VeteranPlayer) => {
    const taken = new Set(
      orderedPlayers(starters.filter((n) => n !== p.numara), numbers).map((o) => shirtNumber(o, numbers)),
    );
    const free = Array.from({ length: 99 }, (_, i) => String(i + 1)).filter((n) => n !== p.numara && !taken.has(n));
    return [p.numara, ...free];
  };

  /** Oyuncuyu ilk 11'e / yedeklere eklemenin önündeki engel (yoksa null) */
  const starterBlock = (p: VeteranPlayer) => {
    if (starters.length >= MAX_STARTERS) return "İlk 11 dolu";
    if (p.kaleci && keeperInXI) return "İlk 11'de zaten bir kaleci var";
    if (p.genc && youthInXI >= MAX_YOUTH_STARTERS) return `İlk 11'de zaten ${MAX_YOUTH_STARTERS} genç var; bu oyuncu yedek olabilir`;
    return null;
  };
  const subBlock = () => (subs.length >= MAX_SUBS ? `Yedekler en fazla ${MAX_SUBS} kişi` : null);

  const toggleStarter = (p: VeteranPlayer) => {
    if (starterSet.has(p.numara)) {
      save({
        starters: starters.filter((n) => n !== p.numara),
        captain: captain === p.numara ? "" : captain,
        numbers: withoutNumber(p.numara),
      });
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
      numbers: withoutNumber(p.numara),
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
                {inXI ? (
                  <>
                    <input
                      className="no-input"
                      inputMode="numeric"
                      maxLength={2}
                      value={numbers[p.numara] ?? p.numara}
                      onChange={(e) => setNumber(p, e.target.value)}
                      onBlur={(e) => !e.target.value && setNumber(p, "")}
                      // Tıklayınca numara seçili kalsın: yeni numara eskisinin üzerine yazılır (en fazla 2 hane)
                      onFocus={(e) => e.target.select()}
                      onMouseUp={(e) => e.preventDefault()}
                      list={`shirt-numbers-${p.numara}`}
                      aria-label={`${p.ad} forma numarası`}
                      title="Forma numarası (bu maç için değiştirilebilir)"
                    />
                    <datalist id={`shirt-numbers-${p.numara}`}>
                      {numberSuggestions(p).map((n) => (
                        <option key={n} value={n} label={n === p.numara ? "Kadrodaki numarası" : undefined} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <span className="no">{p.numara}</span>
                )}
                <span className="name">
                  {p.ad}
                  {p.kaleci && <span className="badge">Kaleci</span>}
                  {p.genc && <span className="badge">Genç</span>}
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
        <Dropdown
          ariaLabel="Kaptan"
          value={starterSet.has(captain) ? captain : ""}
          onChange={(v) => save({ captain: v })}
          disabled={!starters.length}
          options={[
            { value: "", label: starters.length ? "Kaptan seçin" : "Önce ilk 11'i seçin" },
            ...orderedPlayers(starters, numbers).map((p) => ({ value: p.numara, label: `${shirtNumber(p, numbers)} · ${p.ad}` })),
          ]}
        />
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
