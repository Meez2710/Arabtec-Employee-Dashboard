import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Save } from "lucide-react";
import { EmptyState, Kicker } from "@/components/workspace/Primitives";
import { useLocale } from "@/contexts/LocaleContext";
import { consoleText } from "@/lib/consoleCopy";
import { cardSizes, slotLabel } from "./adminShared";
import type { CardSize } from "@/lib/workspaceContent";

export type LayoutRow = { id: number; title: string; slot: string; cardSize: CardSize };

type LayoutComposerProps = {
  rows: LayoutRow[];
  saving: boolean;
  onSave: (rows: LayoutRow[]) => void;
  renderPreview: (rows: LayoutRow[]) => React.ReactNode;
};

/**
 * Reordering is available three ways — arrow buttons, keyboard, and drag —
 * because a hidden press-and-hold gesture is not an affordance.
 */
export function LayoutComposer({ rows, saving, onSave, renderPreview }: LayoutComposerProps) {
  const { locale } = useLocale();
  const c = consoleText(locale);
  const [working, setWorking] = useState<LayoutRow[]>(rows);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => { setWorking(rows); }, [rows]);

  const dirty = working.some((row, index) => rows[index]?.id !== row.id || rows[index]?.cardSize !== row.cardSize);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= working.length) return;
    setWorking(current => {
      const next = current.slice();
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });
  };

  const setSize = (id: number, cardSize: CardSize) =>
    setWorking(current => current.map(row => (row.id === id ? { ...row, cardSize } : row)));

  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.layout.title}</h1>
          <p className="ws-lede">{c.layout.lede}</p>
        </div>
        <button type="button" className="ws-btn ws-btn--primary" onClick={() => onSave(working)} disabled={!dirty || saving}>
          <Save size={16} aria-hidden="true" /> {saving ? c.layout.saving : c.layout.save}
        </button>
      </div>

      <div className="adm__split">
        <section className="adm__panel" aria-label={c.layout.cardOrder}>
          {working.length === 0 ? (
            <EmptyState message={c.layout.empty} />
          ) : (
            <ul className="adm__composer" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {working.map((row, index) => (
                <li
                  key={row.id}
                  className={`adm__composer-row${dragIndex === index ? " is-dragging" : ""}${overIndex === index && dragIndex !== null && dragIndex !== index ? " is-dropbefore" : ""}`}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={event => { event.preventDefault(); setOverIndex(index); }}
                  onDrop={event => { event.preventDefault(); if (dragIndex !== null) move(dragIndex, index); setDragIndex(null); setOverIndex(null); }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                >
                  <span className="adm__composer-grip" aria-hidden="true"><GripVertical size={18} /></span>
                  <span className="adm__composer-label">
                    <strong>{row.title}</strong>
                    <span>{c.slots[row.slot as keyof typeof c.slots] ?? slotLabel(row.slot)}</span>
                  </span>
                  <span className="adm__composer-controls">
                    <label className="sr-only" htmlFor={`size-${row.id}`}>{c.layout.sizeFor(row.title)}</label>
                    <select id={`size-${row.id}`} className="ws-input" style={{ inlineSize: "auto" }} value={row.cardSize} onChange={event => setSize(row.id, event.target.value as CardSize)}>
                      {cardSizes.map(size => <option key={size} value={size}>{c.sizes[size]}</option>)}
                    </select>
                    <button
                      type="button" className="ws-btn ws-btn--sm"
                      onClick={() => move(index, index - 1)} disabled={index === 0}
                      aria-label={c.layout.moveEarlier(row.title)}
                    ><ArrowUp size={14} aria-hidden="true" /></button>
                    <button
                      type="button" className="ws-btn ws-btn--sm"
                      onClick={() => move(index, index + 1)} disabled={index === working.length - 1}
                      aria-label={c.layout.moveLater(row.title)}
                    ><ArrowDown size={14} aria-hidden="true" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="adm__panel" aria-label={c.layout.livePreview}>
          <Kicker>{c.layout.livePreview}</Kicker>
          {renderPreview(working)}
        </aside>
      </div>
    </>
  );
}
