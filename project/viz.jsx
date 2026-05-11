// viz.jsx — central pulsing identity core.
// Two concentric wedge rings:
//   inner = children of focus, weight-sized, lightness+alpha ∝ progress
//   outer = grandchildren, thin wedges sharing parent's angular span
//
// Geometry in a 600×600 viewBox, drawn relative to center (0,0).

const TAU = Math.PI * 2;
const toRad = (deg) => (deg * Math.PI) / 180;

function polar(r, deg) {
  const a = toRad(deg);
  return [r * Math.cos(a), r * Math.sin(a)];
}

function ringArc(rIn, rOut, a0, a1) {
  if (a1 - a0 < 0.01) return "";
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x1, y1] = polar(rOut, a0);
  const [x2, y2] = polar(rOut, a1);
  const [x3, y3] = polar(rIn, a1);
  const [x4, y4] = polar(rIn, a0);
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function strokeArc(r, a0, a1) {
  if (a1 - a0 < 0.01) return "";
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x1, y1] = polar(r, a0);
  const [x2, y2] = polar(r, a1);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// Map progress (0..1) to a wedge appearance.
// Lightness ranges from a dim base to bright. Chroma & hue come from CSS vars
// so the same wedge tints toward whichever accent the user picked.
function wedgeFill(progress) {
  const L = 0.32 + progress * 0.62;
  return `oklch(${L.toFixed(3)} var(--accent-c) var(--accent-h))`;
}
function wedgeOpacity(progress) {
  return 0.20 + progress * 0.80;
}

function CoreViz({ focus, focusPath, onSelect, pulseSpeed = "med", showFragments = true }) {
  const [hover, setHover] = React.useState(null);
  const [hoverKind, setHoverKind] = React.useState(null);

  const children = focus.children || [];
  const totalW = children.reduce((a, c) => a + c.weight, 0) || 1;
  const overall = window.progressOf(focus);

  // Ring radii
  const ringIn = 100;
  const ringOut = 144;
  const outerIn = 156;
  const outerOut = 178;
  const coreR = 78;

  const GAP_DEG = children.length > 1 ? 2.5 : 0;
  const SUB_GAP_DEG = 0.8;
  const usable = 360 - GAP_DEG * children.length;

  // Inner-ring slice geometry.
  let cursor = -90 + GAP_DEG / 2;
  const slices = children.map((c) => {
    const span = (c.weight / totalW) * usable;
    const a0 = cursor;
    const a1 = cursor + span;
    cursor = a1 + GAP_DEG;
    const prog = window.progressOf(c);

    // Grandchild sub-wedges share this slice's angular range.
    const gcs = c.children || [];
    const gcTotalW = gcs.reduce((a, g) => a + g.weight, 0) || 1;
    const gcGapCount = Math.max(0, gcs.length - 1);
    const gcUsable = span - SUB_GAP_DEG * gcGapCount;
    let gcCursor = a0;
    const gcSlices = gcs.map((g) => {
      const gSpan = (g.weight / gcTotalW) * gcUsable;
      const g0 = gcCursor;
      const g1 = gcCursor + gSpan;
      gcCursor = g1 + SUB_GAP_DEG;
      return { node: g, a0: g0, a1: g1, prog: window.progressOf(g) };
    });

    return { node: c, a0, a1, prog, mid: (a0 + a1) / 2, span, gcSlices };
  });

  // Hover resolution.
  let hoverNode = null, hoverParent = null, hoverProg = null;
  if (hover) {
    const slice = slices.find((s) => s.node.id === hover);
    if (slice) { hoverNode = slice.node; hoverProg = slice.prog; }
    else {
      for (const s of slices) {
        const g = s.gcSlices.find((gs) => gs.node.id === hover);
        if (g) { hoverNode = g.node; hoverParent = s.node; hoverProg = g.prog; break; }
      }
    }
  }

  const pulseDur = { slow: "5.4s", med: "3.6s", fast: "2.2s" }[pulseSpeed] || "3.6s";

  return (
    <div className="viz-wrap" style={{ "--pulse-dur": pulseDur }}
         onMouseLeave={() => { setHover(null); setHoverKind(null); }}>
      <svg viewBox="-220 -220 440 440" className="viz-svg" role="img" aria-label="identity core">
        <defs>
          <radialGradient id="g-core" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.94 var(--accent-c) var(--accent-h))" stopOpacity="0.45" />
            <stop offset="55%" stopColor="oklch(0.94 var(--accent-c) var(--accent-h))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="oklch(0.94 var(--accent-c) var(--accent-h))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="g-halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="50%" stopColor="oklch(0.94 var(--accent-c) var(--accent-h))" stopOpacity="0" />
            <stop offset="75%" stopColor="oklch(0.94 var(--accent-c) var(--accent-h))" stopOpacity="0.04" />
            <stop offset="100%" stopColor="oklch(0.94 var(--accent-c) var(--accent-h))" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Halo */}
        <circle r={outerOut + 30} fill="url(#g-halo)" className="viz-pulse" />

        {/* Inner-ring wedges (direct children) */}
        {slices.map((s) => {
          const isHover = hover === s.node.id;
          const isParentOfHover = hoverParent && hoverParent.id === s.node.id;
          const anyHover = hover != null;
          const dim = anyHover && !isHover && !isParentOfHover;
          const fill = wedgeFill(s.prog);
          const op = wedgeOpacity(s.prog) * (dim ? 0.30 : 1) * (isHover ? 1.05 : 1);
          return (
            <g key={s.node.id} className="viz-slice"
               onMouseEnter={() => { setHover(s.node.id); setHoverKind("slice"); }}
               onClick={() => onSelect(s.node.id)}>
              {/* Wedge track (very faint background so empty wedges still read) */}
              <path d={ringArc(ringIn, ringOut, s.a0, s.a1)}
                    fill="oklch(0.30 0 0)" fillOpacity={dim ? 0.04 : 0.10} />
              {/* Filled wedge — color + opacity encode progress */}
              <path d={ringArc(ringIn, ringOut, s.a0, s.a1)}
                    fill={fill} fillOpacity={op}
                    filter={isHover ? "url(#glow-strong)" : (s.prog > 0.4 ? "url(#glow)" : undefined)} />
              {/* Hover rim */}
              {isHover && (
                <path d={strokeArc(ringOut + 4, s.a0, s.a1)}
                      stroke="oklch(0.96 var(--accent-c) var(--accent-h))" strokeOpacity="0.85"
                      strokeWidth="1.2" fill="none" />
              )}
            </g>
          );
        })}

        {/* Outer-ring wedges (grandchildren) — thinner, share parent angles */}
        {showFragments && slices.map((s) => s.gcSlices.map((g) => {
          const isHover = hover === g.node.id;
          const isParentHover = hover === s.node.id && hoverKind === "slice";
          const anyHover = hover != null;
          const dim = anyHover && !isHover && !isParentHover;
          const fill = wedgeFill(g.prog);
          const op = wedgeOpacity(g.prog) * (dim ? 0.28 : 1) * (isHover ? 1.05 : 1);
          return (
            <g key={`${s.node.id}-${g.node.id}`} className="viz-frag"
               onMouseEnter={(e) => { e.stopPropagation(); setHover(g.node.id); setHoverKind("frag"); }}
               onClick={(e) => { e.stopPropagation(); onSelect(g.node.id); }}>
              <path d={ringArc(outerIn, outerOut, g.a0, g.a1)}
                    fill="oklch(0.30 0 0)" fillOpacity={dim ? 0.03 : 0.08} />
              <path d={ringArc(outerIn, outerOut, g.a0, g.a1)}
                    fill={fill} fillOpacity={op}
                    filter={isHover ? "url(#glow-strong)" : (g.prog > 0.5 ? "url(#glow)" : undefined)} />
              {isHover && (
                <path d={strokeArc(outerOut + 3, g.a0, g.a1)}
                      stroke="oklch(0.96 var(--accent-c) var(--accent-h))" strokeOpacity="0.85"
                      strokeWidth="1" fill="none" />
              )}
            </g>
          );
        }))}

        {/* Core */}
        <circle r={coreR + 22} fill="url(#g-core)" className="viz-pulse-strong" />
        <circle r={coreR} fill="var(--bg-2)"
                stroke="oklch(0.70 var(--accent-c) var(--accent-h))" strokeOpacity="0.5" strokeWidth="0.8" />
        <circle r={coreR - 2}
                fill={wedgeFill(overall)} fillOpacity={0.04 + overall * 0.16}
                className="viz-pulse" />
        <circle r={coreR} fill="none"
                stroke={wedgeFill(Math.max(0.6, overall))} strokeOpacity="0.7"
                strokeWidth="1.4"
                strokeDasharray={`${(overall * TAU * coreR).toFixed(1)} ${(TAU * coreR).toFixed(1)}`}
                transform="rotate(-90)"
                filter="url(#glow)" />

        <text className="viz-core-pct" textAnchor="middle" y="-2" fontSize="24">
          {(overall * 100).toFixed(1)}%
        </text>
        <text className="viz-core-name" textAnchor="middle" y="18" fontSize="9.5">
          {focus.name}
        </text>
      </svg>

      <div className={`viz-hover ${hoverNode ? "is-on" : ""}`}>
        {hoverNode ? (
          <>
            <div className="viz-hover-name">{hoverNode.name}</div>
            <div className="viz-hover-meta">
              <span className="viz-hover-pct">{(hoverProg * 100).toFixed(1)}%</span>
              <span className="viz-hover-sep">·</span>
              <span>{hoverParent ? `under ${hoverParent.name}` : `weight ${hoverNode.weight}`}</span>
            </div>
            {hoverNode.description && (
              <div className="viz-hover-desc">{hoverNode.description}</div>
            )}
          </>
        ) : (
          <div className="viz-hover-hint">hover a wedge · click to focus</div>
        )}
      </div>
    </div>
  );
}

window.CoreViz = CoreViz;
