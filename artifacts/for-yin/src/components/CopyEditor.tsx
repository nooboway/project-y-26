import { useState } from "react";

type Path = (string | number)[];

function set(obj: any, [head, ...rest]: Path, value: any): any {
  const copy = Array.isArray(obj) ? [...(obj ?? [])] : { ...(obj ?? {}) };
  copy[head as any] = rest.length ? set(copy[head as any], rest, value) : value;
  return copy;
}

function Leaf({ label, value, onChange }: { label: string; value: string; onChange(v: string): void }) {
  const long = value.length > 80 || label.includes("boot") || label.includes("body");
  return (
    <label className="block mb-3">
      <div className="uppercase-mono opacity-70 mb-1" style={{ fontSize: 10 }}>{label}</div>
      {long
        ? <textarea className="field" rows={3} value={value} onChange={e => onChange(e.target.value)} />
        : <input className="field" value={value} onChange={e => onChange(e.target.value)} />
      }
    </label>
  );
}

function Node({
  val, path, root, onRoot, label,
}: {
  val: any; path: Path; root: any; onRoot(r: any): void; label?: string;
}) {
  const change = (p: Path, v: any) => onRoot(set(root, p, v));

  if (val == null || typeof val === "string") {
    return <Leaf label={label ?? String(path.at(-1) ?? "")} value={val ?? ""} onChange={v => change(path, v)} />;
  }
  if (Array.isArray(val)) {
    return (
      <details className="mb-2">
        <summary className="uppercase-mono cursor-pointer opacity-80 py-1" style={{ fontSize: 10 }}>
          {label ?? String(path.at(-1))} [{val.length}]
        </summary>
        <div className="ml-4 pl-3 border-l hairline mt-2">
          {val.map((item: any, i: number) => (
            typeof item === "string"
              ? <Leaf key={i} label={`${i}`} value={item} onChange={v => change([...path, i], v)} />
              : <Node key={i} val={item} path={[...path, i]} root={root} onRoot={onRoot} label={`${i}`} />
          ))}
          <button type="button" className="btn-pill mt-1" style={{ fontSize: 9 }}
            onClick={() => change(path, [...val, typeof val[0] === "string" ? "" : {}])}>
            + add
          </button>
        </div>
      </details>
    );
  }
  if (typeof val === "object") {
    return (
      <details className="mb-2" open={path.length <= 1}>
        <summary className="uppercase-mono cursor-pointer opacity-80 py-1" style={{ fontSize: 10 }}>
          {label ?? String(path.at(-1))}
        </summary>
        <div className="ml-4 pl-3 border-l hairline mt-2">
          {Object.entries(val).map(([k, v]) => (
            <Node key={k} val={v} path={[...path, k]} root={root} onRoot={onRoot} label={k} />
          ))}
        </div>
      </details>
    );
  }
  return null;
}

export function CopyEditor({
  template, value, onChange,
}: {
  template: Record<string, any>;
  value: Record<string, any> | undefined | null;
  onChange(next: Record<string, any>): void;
}) {
  const merged = JSON.parse(JSON.stringify({ ...template, ...(value ?? {}) }));
  const [draft, setDraft] = useState<Record<string, any>>(merged);

  const handle = (next: any) => { setDraft(next); onChange(next); };

  return (
    <div>
      {Object.entries(draft).map(([k, v]) => (
        <Node key={k} val={v} path={[k]} root={draft} onRoot={handle} label={k} />
      ))}
    </div>
  );
}
