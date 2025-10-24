"use client";
import { useEffect, useMemo, useState } from "react";
import { Sliders, Plus, EyeOff } from "lucide-react";
import type { IComponentProps, IComponentPropertiesProps } from "@/lib/lab/types";
import type { JSONNode } from "./scene";
import FlexAlignMatrix from "./ui/FlexAlignMatrix";

/* ---------------------- helpers ---------------------- */
const styleKeysOf = (def?: IComponentProps | null) => {
  const arr = def?.style ? (Array.isArray(def.style) ? def.style : [def.style]) : [];
  return new Set((arr as any[]).map(x => (typeof x === "string" ? x : x?.name)).filter(Boolean));
};
const hasKey = (keys: Set<string>, k: string) => keys.has(k);
const unitChoices = () => ["pixels", "%"] as const;
const toDisplayUnit = (u?: string) => (u === "%" ? "%" : "px");

/* --------- UI atoms --------- */
const TitleBar = ({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) => (
  <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur px-3 py-2 flex items-center justify-between">
    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">{left}</div>
    {right}
  </div>
);

const Section = ({
  title, right, children,
}: { title: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border bg-white shadow-sm">
    <div className="flex items-center justify-between px-3 py-2 border-b">
      <div className="text-xs font-semibold text-gray-700">{title}</div>
      {right}
    </div>
    <div className="p-3 space-y-3">{children}</div>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-medium text-gray-600">{children}</div>
);

const Chip = ({
  active, onClick, children, disabled, title,
}: { active?: boolean; disabled?: boolean; onClick?: () => void; children: React.ReactNode; title?: string }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    title={title}
    className={[
      "px-2.5 py-1 rounded-md text-xs border transition",
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50",
      active ? "bg-gray-50 border-gray-300 shadow-inner" : "bg-white border-gray-200",
    ].join(" ")}
  >
    {children}
  </button>
);

function UnitInput({
  value, unit, onChangeValue, onChangeUnit, onFillShortcut, placeholder, disabled,
  menuItems = [],
}: {
  value?: number;
  unit?: string;
  onChangeValue: (v?: number) => void;
  onChangeUnit: (u: "pixels" | "%") => void;
  onFillShortcut?: () => void;
  placeholder?: string;
  disabled?: boolean;
  menuItems?: { label: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const displayUnit = toDisplayUnit(unit);

  return (
    <div className="relative">
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value === "" ? undefined : Number(e.target.value);
          onChangeValue(Number.isFinite(v as number) ? (v as number) : undefined);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border px-2 py-1.5 pr-14 text-sm disabled:bg-gray-50"
      />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="absolute top-0.5 right-0.5 h-[30px] min-w-[42px] px-2 rounded-md border bg-white text-xs"
        disabled={disabled}
        title="Unité"
      >
        {displayUnit}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-56 rounded-lg border bg-white shadow-md p-1">
          <button
            onClick={() => { onChangeUnit("pixels"); setOpen(false); }}
            className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-50"
          >
            Pixels
          </button>

          <div className="px-2 pt-1 pb-1 text-[11px] uppercase tracking-wide text-gray-400">Pourcentage</div>
          <button
            onClick={() => { onChangeUnit("%"); onFillShortcut?.(); setOpen(false); }}
            className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-50"
          >
            Remplir (100%)
          </button>
          <button
            onClick={() => { onChangeUnit("%"); setOpen(false); }}
            className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-50"
          >
            Personnalisé
          </button>

          {menuItems.length > 0 && (
            <>
              <div className="mt-1 px-2 pt-1 pb-1 text-[11px] uppercase tracking-wide text-gray-400">Actions</div>
              {menuItems.map((it, i) => (
                <button
                  key={i}
                  onClick={() => { it.onClick(); setOpen(false); }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-50"
                >
                  {it.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const IconBlock = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" className="text-gray-700">
    <rect x="1" y="1" width="18" height="4" rx="1" stroke="currentColor" fill="none" />
    <rect x="1" y="9" width="18" height="4" rx="1" stroke="currentColor" fill="none" />
  </svg>
);
const IconFlexCol = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" className="text-gray-700">
    <rect x="2" y="1" width="16" height="3" rx="1" stroke="currentColor" fill="none" />
    <rect x="2" y="6" width="16" height="3" rx="1" stroke="currentColor" fill="none" />
    <rect x="2" y="11" width="16" height="3" rx="1" stroke="currentColor" fill="none" />
    <path d="M10 0 v-3" stroke="currentColor" />
    <path d="M10 14 v3" stroke="currentColor" />
    <path d="M10 2 v10" stroke="currentColor" markerEnd="url(#arrow-down)" />
    <defs>
      <marker id="arrow-down" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
        <path d="M0,0 L6,3 L0,6 z" fill="currentColor" />
      </marker>
    </defs>
  </svg>
);
const IconFlexRow = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" className="text-gray-700">
    <rect x="1" y="2" width="3" height="10" rx="1" stroke="currentColor" fill="none" />
    <rect x="8" y="2" width="3" height="10" rx="1" stroke="currentColor" fill="none" />
    <rect x="15" y="2" width="3" height="10" rx="1" stroke="currentColor" fill="none" />
    <path d="M0 7 h-3" stroke="currentColor" />
    <path d="M20 7 h3" stroke="currentColor" />
    <path d="M2 7 h16" stroke="currentColor" markerEnd="url(#arrow-right)" />
    <defs>
      <marker id="arrow-right" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 z" fill="currentColor" />
      </marker>
    </defs>
  </svg>
);

/* ---------------------- Inspector ---------------------- */
export default function Inspector({
  collapsed,
  onToggle,
  node,
  def,
  onChangeStyle,
  onChangeProps,
}: {
  collapsed: boolean;
  onToggle: () => void;
  node: JSONNode | null;
  def: IComponentProps | null;
  onChangeStyle: (patch: Record<string, any>) => void;
  onChangeProps: (patch: Record<string, any>) => void;
}) {
  if (collapsed) return <></>;

  const keys = useMemo(() => styleKeysOf(def), [def]);
  const s = node?.style || {};
  const setVal = (k: string, v: any) => onChangeStyle({ [k]: v });

  const isFlex = s.display === "flex";
  const flow = !isFlex ? "block" : (s.flexDirection === "column" ? "col" : "row");
  const setFlow = (mode: "block" | "row" | "col") => {
    if (mode === "block") {
      setVal("display", "block");
      return;
    }
    setVal("display", "flex");
    setVal("flexDirection", mode === "row" ? "row" : "column");
  };

  const canShowPlus =
    hasKey(keys, "minWidth") || hasKey(keys, "maxWidth") || hasKey(keys, "minHeight") || hasKey(keys, "maxHeight");

  const [openAdd, setOpenAdd] = useState(false);
  const [showMinW, setShowMinW] = useState(false);
  const [showMaxW, setShowMaxW] = useState(false);
  const [showMinH, setShowMinH] = useState(false);
  const [showMaxH, setShowMaxH] = useState(false);

  const propDefs = useMemo<IComponentPropertiesProps[]>(() => {
    const arr = def?.props ? (Array.isArray(def.props) ? def.props : [def.props]) : [];
    return arr as IComponentPropertiesProps[];
  }, [def]);

  return (
    <div className="h-full flex flex-col" style={{ colorScheme: "light" }}>
      <TitleBar
        left={<><Sliders size={16} /> Inspecteur</>}
        right={
          <button onClick={onToggle} className="text-xs rounded-lg px-2 py-1.5 border bg-white hover:bg-gray-50">
            Replier
          </button>
        }
      />

      <div className="p-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-gray-600 truncate">
            {node && def ? (
              <>
                <span className="font-semibold">{node.name}</span>
                <span className="mx-1.5 text-gray-400">•</span>
                <span className="uppercase tracking-wide text-gray-500">{def.id}</span>
              </>
            ) : "Aucun élément sélectionné"}
          </div>
        </div>
      </div>

      {!node || !def ? (
        <div className="p-4 text-sm text-gray-500">Sélectionne un élément dans la scène.</div>
      ) : (
        <div className="p-3 space-y-3 overflow-auto text-sm">
          {/* =================== AUTO LAYOUT =================== */}
          <Section
            title="Auto layout"
            right={
              canShowPlus ? (
                <div className="relative">
                  <button
                    onClick={() => setOpenAdd(v => !v)}
                    className="h-7 w-7 grid place-items-center rounded-md border hover:bg-gray-50"
                    aria-label="Plus d'options"
                    title="Plus d'options"
                  >
                    <Plus size={14} />
                  </button>
                  {openAdd && (
                    <div className="absolute right-0 mt-1 w-48 rounded-lg border bg-white shadow-lg p-2 z-10">
                      {hasKey(keys, "minWidth") && (
                        <label className="flex items-center gap-2 text-[12px] px-1 py-1 cursor-pointer">
                          <input type="checkbox" checked={showMinW} onChange={(e) => setShowMinW(e.target.checked)} />
                          Largeur min
                        </label>
                      )}
                      {hasKey(keys, "maxWidth") && (
                        <label className="flex items-center gap-2 text-[12px] px-1 py-1 cursor-pointer">
                          <input type="checkbox" checked={showMaxW} onChange={(e) => setShowMaxW(e.target.checked)} />
                          Largeur max
                        </label>
                      )}
                      {hasKey(keys, "minHeight") && (
                        <label className="flex items-center gap-2 text-[12px] px-1 py-1 cursor-pointer">
                          <input type="checkbox" checked={showMinH} onChange={(e) => setShowMinH(e.target.checked)} />
                          Hauteur min
                        </label>
                      )}
                      {hasKey(keys, "maxHeight") && (
                        <label className="flex items-center gap-2 text-[12px] px-1 py-1 cursor-pointer">
                          <input type="checkbox" checked={showMaxH} onChange={(e) => setShowMaxH(e.target.checked)} />
                          Hauteur max
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ) : null
            }
          >
            {/* Flow — icônes seules */}
            {hasKey(keys, "display") && (
              <div>
                <Label>Flow</Label>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  <Chip active={flow === "block"} onClick={() => setFlow("block")} title="Bloc">
                    <IconBlock />
                  </Chip>
                  <Chip active={flow === "col"} onClick={() => setFlow("col")} title="Flex colonne">
                    <IconFlexCol />
                  </Chip>
                  <Chip active={flow === "row"} onClick={() => setFlow("row")} title="Flex ligne">
                    <IconFlexRow />
                  </Chip>
                </div>
              </div>
            )}

            {/* Resizing via menu d’unité */}
            {(hasKey(keys, "width") || hasKey(keys, "height")) && (
              <div className="grid grid-cols-2 gap-2">
                {hasKey(keys, "width") && (
                  <div>
                    <Label>Largeur</Label>
                    <div className="mt-1">
                      <UnitInput
                        value={s.width}
                        unit={s.widthUnit}
                        onChangeValue={(v) => setVal("width", v ?? 0)}
                        onChangeUnit={(u) => setVal("widthUnit", u)}
                        onFillShortcut={() => { setVal("width", 100); setVal("widthUnit", "%"); }}
                        placeholder="ex: 320"
                      />
                    </div>
                    {showMinW && hasKey(keys, "minWidth") && (
                      <div className="mt-1">
                        <UnitInput
                          value={s.minWidth}
                          unit={s.minWidthUnit}
                          onChangeValue={(v) => setVal("minWidth", v ?? 0)}
                          onChangeUnit={(u) => setVal("minWidthUnit", u)}
                          onFillShortcut={() => { setVal("minWidth", 100); setVal("minWidthUnit", "%"); }}
                          placeholder="Min"
                        />
                      </div>
                    )}
                    {showMaxW && hasKey(keys, "maxWidth") && (
                      <div className="mt-1">
                        <UnitInput
                          value={s.maxWidth}
                          unit={s.maxWidthUnit}
                          onChangeValue={(v) => setVal("maxWidth", v ?? 0)}
                          onChangeUnit={(u) => setVal("maxWidthUnit", u)}
                          onFillShortcut={() => { setVal("maxWidth", 100); setVal("maxWidthUnit", "%"); }}
                          placeholder="Max"
                        />
                      </div>
                    )}
                  </div>
                )}

                {hasKey(keys, "height") && (
                  <div>
                    <Label>Hauteur</Label>
                    <div className="mt-1">
                      <UnitInput
                        value={s.height}
                        unit={s.heightUnit}
                        onChangeValue={(v) => setVal("height", v ?? 0)}
                        onChangeUnit={(u) => setVal("heightUnit", u)}
                        onFillShortcut={() => { setVal("height", 100); setVal("heightUnit", "%"); }}
                        placeholder="ex: 200"
                      />
                    </div>
                    {showMinH && hasKey(keys, "minHeight") && (
                      <div className="mt-1">
                        <UnitInput
                          value={s.minHeight}
                          unit={s.minHeightUnit}
                          onChangeValue={(v) => setVal("minHeight", v ?? 0)}
                          onChangeUnit={(u) => setVal("minHeightUnit", u)}
                          onFillShortcut={() => { setVal("minHeight", 100); setVal("minHeightUnit", "%"); }}
                          placeholder="Min"
                        />
                      </div>
                    )}
                    {showMaxH && hasKey(keys, "maxHeight") && (
                      <div className="mt-1">
                        <UnitInput
                          value={s.maxHeight}
                          unit={s.maxHeightUnit}
                          onChangeValue={(v) => setVal("maxHeight", v ?? 0)}
                          onChangeUnit={(u) => setVal("maxHeightUnit", u)}
                          onFillShortcut={() => { setVal("maxHeight", 100); setVal("maxHeightUnit", "%"); }}
                          placeholder="Max"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Alignement (Flex) */}
            {isFlex && (hasKey(keys, "justifyContent") || hasKey(keys, "alignItems")) && (
              <div>
                <div className="mt-2">
                  <FlexAlignMatrix
                    direction={(s.flexDirection as any) || "row"}
                    justify={(s.justifyContent as any) || "flex-start"}
                    align={(s.alignItems as any) || "stretch"}
                    gap={s.gap ?? 0}
                    onChange={(patch) => {
                      Object.entries(patch).forEach(([k, v]) => hasKey(keys, k) && setVal(k as any, v as any));
                    }}
                  />
                </div>
              </div>
            )}

            {/* Gap */}
            {hasKey(keys, "gap") && (
              <div>
                <Label>Espacement (Gap)</Label>
                <div className="mt-1">
                  <UnitInput
                    value={s.gap}
                    unit={s.gapUnit}
                    onChangeValue={(v) => setVal("gap", v ?? 0)}
                    onChangeUnit={(u) => setVal("gapUnit", u)}
                    onFillShortcut={() => { setVal("gap", 100); setVal("gapUnit", "%"); }}
                    menuItems={[
                      {
                        label: "Auto (space-between + 0)",
                        onClick: () => { setVal("justifyContent", "space-between"); setVal("gap", 0); },
                      },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Padding */}
            {hasKey(keys, "padding") && (
              <div>
                <Label>Padding</Label>
                <div className="mt-1">
                  <UnitInput
                    value={s.padding}
                    unit={s.paddingUnit}
                    onChangeValue={(v) => setVal("padding", v ?? 0)}
                    onChangeUnit={(u) => setVal("paddingUnit", u)}
                    onFillShortcut={() => { setVal("padding", 100); setVal("paddingUnit", "%"); }}
                  />
                </div>
              </div>
            )}

            {/* Clip content */}
            {hasKey(keys, "overflow") && (
              <label className="mt-1 inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={s.overflow === "hidden"}
                  onChange={(e) => setVal("overflow", e.target.checked ? "hidden" : "visible")}
                />
                <span className="text-[12px] text-gray-700 inline-flex items-center gap-1">
                  <EyeOff size={14} /> Masquer le contenu débordant
                </span>
              </label>
            )}
          </Section>

          {/* =================== APPARENCE =================== */}
          {(hasKey(keys, "backgroundColor") ||
            hasKey(keys, "borderWidth") ||
            hasKey(keys, "borderStyle") ||
            hasKey(keys, "borderColor") ||
            hasKey(keys, "borderRadius") ||
            hasKey(keys, "opacity") ||
            hasKey(keys, "boxShadow")) && (
              <Section title="Apparence">
                <div className="grid grid-cols-2 gap-2">
                  {hasKey(keys, "backgroundColor") && (
                    <div className="col-span-2">
                      <Label>Couleur de fond</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={s.backgroundColor ?? "#ffffff"}
                          onChange={(e) => setVal("backgroundColor", e.target.value)}
                          className="h-8 w-10 rounded border"
                          aria-label="Couleur"
                        />
                        <input
                          value={s.backgroundColor ?? "#ffffff"}
                          onChange={(e) => setVal("backgroundColor", e.target.value)}
                          className="min-w-0 flex-1 rounded-md border px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {hasKey(keys, "opacity") && (
                    <div>
                      <Label>Opacité</Label>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={s.opacity ?? 1}
                        onChange={(e) => setVal("opacity", Number(e.target.value))}
                        className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                      />
                    </div>
                  )}

                  {(hasKey(keys, "borderWidth") || hasKey(keys, "borderStyle") || hasKey(keys, "borderColor")) && (
                    <div className="col-span-2">
                      <Label>Bordure</Label>
                      <div className="mt-1 grid grid-cols-3 gap-2">
                        {hasKey(keys, "borderWidth") && (
                          <UnitInput
                            value={s.borderWidth}
                            unit={s.borderWidthUnit}
                            onChangeValue={(v) => setVal("borderWidth", v ?? 0)}
                            onChangeUnit={(u) => setVal("borderWidthUnit", u)}
                            onFillShortcut={() => { setVal("borderWidth", 100); setVal("borderWidthUnit", "%"); }}
                          />
                        )}
                        {hasKey(keys, "borderStyle") && (
                          <select
                            value={s.borderStyle ?? "solid"}
                            onChange={(e) => setVal("borderStyle", e.target.value)}
                            className="rounded-md border px-2 py-1.5 text-sm"
                          >
                            {["solid", "dashed", "dotted", "double", "none"].map(o => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        )}
                        {hasKey(keys, "borderColor") && (
                          <input
                            type="color"
                            value={s.borderColor ?? "#e5e7eb"}
                            onChange={(e) => setVal("borderColor", e.target.value)}
                            className="h-8 w-full rounded border"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {hasKey(keys, "borderRadius") && (
                    <div>
                      <Label>Arrondi</Label>
                      <UnitInput
                        value={s.borderRadius}
                        unit={s.borderRadiusUnit}
                        onChangeValue={(v) => setVal("borderRadius", v ?? 0)}
                        onChangeUnit={(u) => setVal("borderRadiusUnit", u)}
                        onFillShortcut={() => { setVal("borderRadius", 100); setVal("borderRadiusUnit", "%"); }}
                      />
                    </div>
                  )}

                  {hasKey(keys, "boxShadow") && (
                    <div className="col-span-2">
                      <Label>Ombre (CSS)</Label>
                      <input
                        value={s.boxShadow ?? ""}
                        onChange={(e) => setVal("boxShadow", e.target.value)}
                        className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                        placeholder="ex: 0 2px 8px rgba(0,0,0,.12)"
                      />
                    </div>
                  )}
                </div>
              </Section>
            )}

          {/* =================== PROPS =================== */}
          {propDefs.length > 0 && (
            <Section title="Props">
              <div className="grid grid-cols-2 gap-2">
                {propDefs.map((p) => {
                  const v = node?.props?.[p.name];
                  if (p.type === "boolean") {
                    return (
                      <label key={p.name} className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={!!v}
                          onChange={(e) => onChangeProps({ [p.name]: e.target.checked })}
                        />
                        {p.label || p.name}
                      </label>
                    );
                  }
                  if (p.type === "color") {
                    return (
                      <div key={p.name}>
                        <Label>{p.label || p.name}</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="color"
                            value={v ?? "#000000"}
                            onChange={(e) => onChangeProps({ [p.name]: e.target.value })}
                            className="h-8 w-10 rounded border"
                          />
                          <input
                            value={v ?? "#000000"}
                            onChange={(e) => onChangeProps({ [p.name]: e.target.value })}
                            className="min-w-0 flex-1 rounded-md border px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    );
                  }
                  if (p.type === "select" && p.select?.length) {
                    return (
                      <div key={p.name}>
                        <Label>{p.label || p.name}</Label>
                        <select
                          value={v ?? p.select[0]}
                          onChange={(e) => onChangeProps({ [p.name]: e.target.value })}
                          className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                        >
                          {p.select.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    );
                  }
                  return (
                    <div key={p.name}>
                      <Label>{p.label || p.name}</Label>
                      <input
                        value={v ?? ""}
                        onChange={(e) => onChangeProps({ [p.name]: e.target.value })}
                        className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
