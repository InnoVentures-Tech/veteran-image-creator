import { useEffect, useRef, useState } from "react";
import {
  canvasToJpeg,
  defaultData,
  emptyRow,
  renderTemplate,
  type ImageTemplate,
  type ListField,
  type Row,
  type TemplateData,
  type TemplateField,
} from "./studio/engine";
import { TEMPLATES } from "./templates";

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
      return [t.id, s ? { values: { ...base.values, ...s.values }, lists: { ...base.lists, ...s.lists } } : base];
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
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
      <select
        className="template-select"
        aria-label="Şablon"
        value={template.id}
        onChange={(e) => setTemplateId(e.target.value)}
      >
        {TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

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
          <canvas ref={preview} width={1600} height={2000} aria-label={`${template.name} önizleme`} />
        </section>
      </main>
    </div>
  );
};
