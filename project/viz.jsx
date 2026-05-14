// viz.jsx — central pulsing identity core.
// Two concentric wedge rings:
//   inner = children of focus, weight-sized, lightness+alpha ∝ progress
//   outer = grandchildren, thin wedges sharing parent's angular span
//
// Geometry in a 600×600 viewBox, drawn relative to center (0,0).
//
// Performance notes:
//   - All path geometry is computed once in useMemo([focus]) — never on hover.
//   - Visual hover effects (dim/glow/rim) are CSS-only: no React re-renders.
//   - svgRef.current.classList is mutated directly for the is-hovering class.
//   - Only hoverData state (tooltip text) triggers a React render on hover.

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

function wedgeFill(progress) {
  const L = 0.32 + progress * 0.62;
  return `oklch(${L.toFixed(3)} var(--accent-c) var(--accent-h))`;
}
function wedgeOpacity(progress) {
  return 0.20 + progress * 0.80;
}

const RING_IN = 100, RING_OUT = 144;
const OUTER_IN = 156, OUTER_OUT = 178;
const CORE_R = 78;
const GAP_DEG = 2.5;
const SUB_GAP_DEG = 0.8;

// Pure geometry builder — called only when focus changes.
function buildSlices(focus) {
  const children = focus.children || [];
  const totalW = children.reduce((a, c) => a + c.weight, 0) || 1;
  const gapDeg = children.length > 1 ? GAP_DEG : 0;
  const usable = 360 - gapDeg * children.length;
  let cursor = -90 + gapDeg / 2;

  return children.map((c) => {
    const span = (c.weight / totalW) * usable;
    const a0 = cursor;
    const a1 = cursor + span;
    cursor = a1 + gapDeg;
    const prog = window.progressOf(c);

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
      const gProg = window.progressOf(g);
      return {
        node: g, a0: g0, a1: g1, prog: gProg,
        fill: wedgeFill(gProg),
        opacity: wedgeOpacity(gProg),
        path: ringArc(OUTER_IN, OUTER_OUT, g0, g1),
        strokePath: strokeArc(OUTER_OUT + 3, g0, g1),
        hasGlow: gProg > 0.5,
      };
    });

    return {
      node: c, a0, a1, prog,
      fill: wedgeFill(prog),
      opacity: wedgeOpacity(prog),
      path: ringArc(RING_IN, RING_OUT, a0, a1),
      strokePath: strokeArc(RING_OUT + 4, a0, a1),
      hasGlow: prog > 0.4,
      gcSlices,
    };
  });
}

function CoreViz({ focus, focusPath, onSelect, pulseSpeed = "med", showFragments = true }) {
  const svgRef = React.useRef(null);
  // hoverData drives only the tooltip — all visual effects are CSS-only.
  const [hoverData, setHoverData] = React.useState(null);

  // Geometry recomputes only when focus changes, never on hover.
  const slices = React.useMemo(() => buildSlices(focus), [focus]);
  const overall = React.useMemo(() => window.progressOf(focus), [focus]);

  const pulseDur = { slow: "5.4s", med: "3.6s", fast: "2.2s" }[pulseSpeed] || "3.6s";

  // Mutate the SVG class directly — no React render needed for the dim effect.
  const handleSliceEnter = React.useCallback((s) => {
    svgRef.current?.classList.add("is-hovering");
    setHoverData({ node: s.node, prog: s.prog, parent: null });
  }, []);

  const handleFragEnter = React.useCallback((g, parentNode) => {
    svgRef.current?.classList.add("is-hovering");
    setHoverData({ node: g.node, prog: g.prog, parent: parentNode });
  }, []);

  const handleLeave = React.useCallback(() => {
    svgRef.current?.classList.remove("is-hovering");
    setHoverData(null);
  }, []);

  return (
    <div className="viz-wrap" style={{ "--pulse-dur": pulseDur }}
         onMouseLeave={handleLeave}>
      <svg ref={svgRef} viewBox="-220 -220 440 440" className="viz-svg" role="img" aria-label="identity core">
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
        <circle r={OUTER_OUT + 30} fill="url(#g-halo)" className="viz-pulse" />

        {/*
          Each .viz-segment groups an inner slice + its outer fragments.
          CSS uses `.viz-svg.is-hovering .viz-segment { opacity: 0.35 }` to dim all,
          then `.viz-svg.is-hovering .viz-segment:hover { opacity: 1 }` to un-dim
          whichever segment the cursor is over — including when hovering a fragment
          (the :hover bubbles up to the parent .viz-segment).
        */}
        {slices.map((s) => (
          <g key={s.node.id} className="viz-segment">
            {/* Inner-ring wedge */}
            <g className="viz-slice"
               onMouseEnter={() => handleSliceEnter(s)}
               onClick={() => onSelect(s.node.id)}>
              <path d={s.path} fill="oklch(0.30 0 0)" fillOpacity="0.10" />
              <path d={s.path} fill={s.fill} fillOpacity={s.opacity}
                    className={s.hasGlow ? "viz-fill has-glow" : "viz-fill"} />
              {/* Rim: always in DOM, shown/hidden by CSS :hover */}
              <path d={s.strokePath}
                    stroke="oklch(0.96 var(--accent-c) var(--accent-h))" strokeOpacity="0.85"
                    strokeWidth="1.2" fill="none" className="viz-rim" />
            </g>

            {/* Outer-ring fragments (grandchildren) */}
            {showFragments && s.gcSlices.map((g) => (
              <g key={g.node.id} className="viz-frag"
                 onMouseEnter={(e) => { e.stopPropagation(); handleFragEnter(g, s.node); }}
                 onClick={(e) => { e.stopPropagation(); onSelect(g.node.id); }}>
                <path d={g.path} fill="oklch(0.30 0 0)" fillOpacity="0.08" />
                <path d={g.path} fill={g.fill} fillOpacity={g.opacity}
                      className={g.hasGlow ? "viz-fill has-glow" : "viz-fill"} />
                <path d={g.strokePath}
                      stroke="oklch(0.96 var(--accent-c) var(--accent-h))" strokeOpacity="0.85"
                      strokeWidth="1" fill="none" className="viz-rim" />
              </g>
            ))}
          </g>
        ))}

        {/* Core */}
        <circle r={CORE_R + 22} fill="url(#g-core)" className="viz-pulse-strong" />
        <circle r={CORE_R} fill="var(--bg-2)"
                stroke="oklch(0.70 var(--accent-c) var(--accent-h))" strokeOpacity="0.5" strokeWidth="0.8" />
        <circle r={CORE_R - 2}
                fill={wedgeFill(overall)} fillOpacity={0.04 + overall * 0.16}
                className="viz-pulse" />
        <circle r={CORE_R} fill="none"
                stroke={wedgeFill(Math.max(0.6, overall))} strokeOpacity="0.7"
                strokeWidth="1.4"
                strokeDasharray={`${(overall * TAU * CORE_R).toFixed(1)} ${(TAU * CORE_R).toFixed(1)}`}
                transform="rotate(-90)"
                filter="url(#glow)" />

        <text className="viz-core-pct" textAnchor="middle" y="-2" fontSize="24">
          {(overall * 100).toFixed(1)}%
        </text>
        <text className="viz-core-name" textAnchor="middle" y="18" fontSize="9.5">
          {focus.name}
        </text>
      </svg>

      <div className={`viz-hover ${hoverData ? "is-on" : ""}`}>
        {hoverData ? (
          <>
            <div className="viz-hover-name">{hoverData.node.name}</div>
            <div className="viz-hover-meta">
              <span className="viz-hover-pct">{(hoverData.prog * 100).toFixed(1)}%</span>
              <span className="viz-hover-sep">·</span>
              <span>{hoverData.parent ? `under ${hoverData.parent.name}` : `weight ${hoverData.node.weight}`}</span>
            </div>
            {hoverData.node.description && (
              <div className="viz-hover-desc">{hoverData.node.description}</div>
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
