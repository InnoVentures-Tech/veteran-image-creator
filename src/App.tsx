import { useEffect, useRef, useState } from "react";
import {
  canvasToJpeg,
  defaultData,
  emptyRow,
  parseNames,
  renderTemplate,
  type ImageTemplate,
  type ListField,
  type Row,
  type TemplateData,
  type TemplateField,
} from "./studio/engine";
import { Dropdown } from "./Dropdown";
import { TEMPLATES } from "./templates";
import { VeteranLineupEditor } from "./VeteranLineupEditor";

type Scalar = Exclude<TemplateField, ListField>;

const STORAGE_KEY = "veteran-image-creator:v1";

// Son girilen içerik tarayıcıda hatırlanır; yüklenen görseller (büyük data URL'ler) saklanmaz.
const loadSaved = (): Record<string, TemplateData> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
};
const save = (all: Record<string, TemplateData>) => {
  const imageKeys = (t: ImageTemplate) => t.fields.filter((f) => f.type === "image").map((f) => f.key);
  const slim = Object.fromEntries(
    TEMPLATES.map((t) => {
      const d = all[t.id];
      const values = Object.fromEntries(Object.entries(d.values).filter(([k]) => !imageKeys(t).includes(k)));
      return [t.id, { ...d, values }];
    }),
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch {
    // Gizli sekme vb.: hatırlamadan devam edilir
  }
};

const initialData = () => {
  const saved = loadSaved();
  return Object.fromEntries(
    TEMPLATES.map((t) => {
      const base = defaultData(t);
      const s = saved[t.id];
      if (!s) return [t.id, base];
      const values = { ...base.values, ...s.values };
      // Kaldırılmış bir seçenek (örn. eski arka plan) kayıtlıysa varsayılana dönülür; yoksa görsel eksik çizilir
      for (const f of t.fields)
        if ((f.type === "select" || f.type === "radio") && !f.options.some((o) => o.value === values[f.key]))
          values[f.key] = base.values[f.key];
      return [t.id, { values, lists: { ...base.lists, ...s.lists } }];
    }),
  );
};

const slug = (text: string) =>
  text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (ch) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const fileName = (template: ImageTemplate, data: TemplateData) => {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const label = slug(template.fileLabel?.(data) ?? template.id);
  return `karabuk-akademi-veteranlar-${label}-${stamp}.jpg`;
};

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Görsel okunamadı"));
    reader.readAsDataURL(file);
  });

const ScalarInput = ({ field, value, onChange }: { field: Scalar; value: string; onChange: (v: string) => void }) => {
  switch (field.type) {
    case "text":
      return (
        <input
          value={value}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "textarea":
      return (
        <textarea
          rows={3}
          value={value}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <Dropdown value={value} options={field.options} onChange={onChange} ariaLabel={field.label} />
      );
    case "radio":
      return (
        <div className="radios">
          {field.options.map((o) => (
            <label key={o.value} className={o.value === value ? "on" : ""}>
              <input type="radio" checked={o.value === value} onChange={() => onChange(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      );
    case "image":
      return (
        <div className="image-input">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) onChange(await readFile(file));
              e.target.value = "";
            }}
          />
          {value && (
            <button type="button" className="link" onClick={() => onChange("")}>
              Kaldır
            </button>
          )}
        </div>
      );
    default:
      return <p className="hint">Bu alan türü burada desteklenmiyor.</p>;
  }
};

const hintOf = (field: TemplateField) => ("hint" in field ? field.hint : undefined);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="field">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="hint">{hint}</span>}
  </label>
);

const normalizeSearch = (text: string) => text.toLocaleLowerCase("tr-TR").trim();

/**
 * Kadrodan çoklu seçim: seçilenler üstte etiket olarak listedeki sırayla görünür; değer alfabetik sıralı satır satır
 * adlardır (value), listede label gösterilir (örn. "21 - Ramazan Ç.").
 */
const PlayersInput = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => {
  const [query, setQuery] = useState("");
  const players = options.map((o) => o.value);
  const labelOf = (name: string) => options.find((o) => o.value === name)?.label ?? name;
  const selected = parseNames(value);
  const selectedSet = new Set(selected);
  const chips = [...players.filter((name) => selectedSet.has(name)), ...selected.filter((name) => !players.includes(name))];
  const save = (names: string[]) => onChange(parseNames([...new Set(names)].join("\n")).join("\n"));
  const toggle = (name: string) => save(selectedSet.has(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  const search = normalizeSearch(query);
  const visible = players.filter((name) => !search || normalizeSearch(labelOf(name)).includes(search));

  return (
    <div className="players">
      <div className="chips">
        {chips.length ? (
          chips.map((name) => (
            <span key={name} className="chip">
              {labelOf(name)}
              <button type="button" aria-label={`${name} kadrodan çıkar`} onClick={() => toggle(name)}>
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="hint">Henüz oyuncu seçilmedi.</span>
        )}
      </div>
      <div className="players-search">
        <input value={query} placeholder="Oyuncu ara…" onChange={(e) => setQuery(e.target.value)} />
        <span className="count">
          {selected.length}/{players.length}
        </span>
      </div>
      <div className="players-actions">
        <button type="button" className="link on" onClick={() => save([...selected, ...visible])} disabled={!visible.length}>
          {search ? "Bulunanları seç" : "Tümünü seç"}
        </button>
        <button type="button" className="link danger" onClick={() => save([])} disabled={!selected.length}>
          Temizle
        </button>
      </div>
      <div className="checklist">
        {visible.length ? (
          visible.map((name) => (
            <label key={name}>
              <input type="checkbox" checked={selectedSet.has(name)} onChange={() => toggle(name)} />
              {labelOf(name)}
            </label>
          ))
        ) : (
          <p className="hint">Aramayla eşleşen oyuncu yok.</p>
        )}
      </div>
    </div>
  );
};

const ListInput = ({ field, rows, onChange }: { field: ListField; rows: Row[]; onChange: (rows: Row[]) => void }) => {
  const update = (i: number, key: string, value: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  return (
    <div className="list">
      <span className="label">
        {field.label} ({rows.length}/{field.max})
      </span>
      {rows.map((row, i) => (
        <div key={i} className="list-row" style={{ gridTemplateColumns: `${field.fields.map((f, k) => (k === 0 && f.type === "text" ? "4.5rem" : "minmax(0,1fr)")).join(" ")} auto` }}>
          {field.fields.map((sub) => (
            <ScalarInput key={sub.key} field={sub} value={row[sub.key] ?? ""} onChange={(v) => update(i, sub.key, v)} />
          ))}
          <button
            type="button"
            className="icon"
            aria-label={`${field.itemLabel} ${i + 1} sil`}
            disabled={rows.length <= field.min}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      {rows.length < field.max && (
        <button type="button" className="add" onClick={() => onChange([...rows, emptyRow(field)])}>
          + {field.itemLabel} ekle
        </button>
      )}
    </div>
  );
};

export const App = () => {
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [dataById, setDataById] = useState<Record<string, TemplateData>>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const data = dataById[template.id];

  const patch = (change: (d: TemplateData) => TemplateData) =>
    setDataById((all) => ({ ...all, [template.id]: change(all[template.id]) }));
  const setValue = (key: string, value: string) => patch((d) => ({ ...d, values: { ...d.values, [key]: value } }));
  const setList = (key: string, rows: Row[]) => patch((d) => ({ ...d, lists: { ...d.lists, [key]: rows } }));

  useEffect(() => save(dataById), [dataById]);

  // Önizleme kısa bir gecikmeyle yeniden çizilir; yalnızca son isteğin sonucu gösterilir
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const off = document.createElement("canvas");
      try {
        await renderTemplate(off, template, data);
        if (cancelled || !preview.current) return;
        const c = preview.current;
        c.width = off.width;
        c.height = off.height;
        c.getContext("2d")?.drawImage(off, 0, 0);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Önizleme çizilemedi.");
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [template, data]);

  const download = async () => {
    const problem = template.validate?.(data);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      await renderTemplate(canvas, template, data);
      const blob = await canvasToJpeg(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(template, data);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel indirilemedi, lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  // Eksik ya da hatalı seçim varsa indirme kapalıdır; nedeni önizlemenin altında yazar
  const blocked = template.validate?.(data) ?? null;

  // inlineRows: gruptaki alanlar ilk alanın yerinde yan yana çizilir
  const inlineOf = (key: string) => template.inlineRows?.find((g) => g.includes(key));
  const scalarByKey = (key: string) => template.fields.find((f) => f.key === key) as Scalar | undefined;

  return (
    <div className="page">
      <header>
        <div>
          <p className="eyebrow">Karabük Akademi Veteranlar</p>
          <h1>Görsel Oluşturucu</h1>
        </div>
        <button type="button" className="primary" onClick={download} disabled={busy}>
          {busy ? "Hazırlanıyor…" : "JPEG olarak indir"}
        </button>
      </header>

      <nav role="tablist" aria-label="Şablon">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === template.id}
            className={t.id === template.id ? "on" : ""}
            onClick={() => setTemplateId(t.id)}
          >
            {t.name}
          </button>
        ))}
      </nav>
      {/* Telefonda sekmeler sığmadığı için şablon açılır listeden seçilir */}
      <Dropdown
        className="template-select"
        ariaLabel="Şablon"
        value={template.id}
        options={TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
        onChange={setTemplateId}
      />

      <main>
        <section className="form">
          <div className="form-head">
            <p className="hint">{template.description}</p>
            <button
              type="button"
              className="link"
              onClick={() => setDataById((all) => ({ ...all, [template.id]: defaultData(template) }))}
            >
              Varsayılana dön
            </button>
          </div>
          {template.fields.map((field) => {
            if (field.type === "list")
              return (
                <ListInput key={field.key} field={field} rows={data.lists[field.key] ?? []} onChange={(r) => setList(field.key, r)} />
              );
            if (field.type === "veteranLineup")
              return (
                <VeteranLineupEditor key={field.key} value={data.values[field.key] ?? ""} onChange={(v) => setValue(field.key, v)} />
              );
            // Etiket (<label>) içinde olursa boş alana tıklamak ilk düğmeyi (oyuncu çıkar) tetikler; bu yüzden div
            if (field.type === "players")
              return (
                <div key={field.key} className="field">
                  <span className="label">{field.label}</span>
                  <PlayersInput
                    value={data.values[field.key] ?? ""}
                    onChange={(v) => setValue(field.key, v)}
                    options={field.options ?? []}
                  />
                  {field.hint && <span className="hint">{field.hint}</span>}
                </div>
              );
            const group = inlineOf(field.key);
            if (group && group[0] !== field.key) return null;
            if (group)
              return (
                <div key={field.key} className="inline">
                  {group.map((key) => {
                    const f = scalarByKey(key);
                    return f ? (
                      <Field key={key} label={f.label} hint={hintOf(f)}>
                        <ScalarInput field={f} value={data.values[key] ?? ""} onChange={(v) => setValue(key, v)} />
                      </Field>
                    ) : null;
                  })}
                </div>
              );
            return (
              <Field key={field.key} label={field.label} hint={hintOf(field)}>
                <ScalarInput field={field} value={data.values[field.key] ?? ""} onChange={(v) => setValue(field.key, v)} />
              </Field>
            );
          })}
        </section>

        <section className="preview">
          {error && <p className="error">{error}</p>}
          {/* Sayfa kaydırılınca üstteki düğme görünmez; önizlemenin üstüne gelince ortada indirme düğmesi çıkar */}
          <div className="preview-frame">
            <canvas ref={preview} width={1600} height={2000} aria-label={`${template.name} önizleme`} />
            <div className="preview-overlay">
              <button type="button" className="primary" onClick={download} disabled={busy || !!blocked}>
                {busy ? "Hazırlanıyor…" : "JPEG olarak indir"}
              </button>
            </div>
          </div>
          {blocked && <p className="notice">{blocked}</p>}
        </section>
      </main>
    </div>
  );
};
