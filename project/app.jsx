// app.jsx — main App: state, layout, collapsible side panes.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "neutral",
  "pulseSpeed": "med",
  "scanlines": false,
  "noise": false,
  "showFragments": true,
  "vignette": true,
  "density": "regular"
}/*EDITMODE-END*/;

// hue + chroma so accent can be fully neutral (chroma 0) or tinted.
const ACCENTS = {
  neutral:  { hue: 240, chroma: 0.000 },
  ice:      { hue: 230, chroma: 0.020 },
  phosphor: { hue: 145, chroma: 0.130 },
  amber:    { hue: 75,  chroma: 0.120 },
  cyan:     { hue: 200, chroma: 0.110 },
  magenta:  { hue: 320, chroma: 0.130 }
};

function applyAccent(name) {
  const a = ACCENTS[name] || ACCENTS.neutral;
  document.documentElement.style.setProperty("--accent-h", a.hue);
  document.documentElement.style.setProperty("--accent-c", a.chroma);
}

function useClock() {
  const [t, setT] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function formatTime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBar({ root, focus }) {
  const t = useClock();
  const totalNodes = (function count(n) { return 1 + (n.children || []).reduce((a, c) => a + count(c), 0); })(root);
  const totalTasks = (function tcount(n) {
    return (n.tasks || []).length + (n.children || []).reduce((a, c) => a + tcount(c), 0);
  })(root);
  const doneTasks = (function dcount(n) {
    return (n.tasks || []).filter((x) => x.done).length + (n.children || []).reduce((a, c) => a + dcount(c), 0);
  })(root);
  const overall = window.progressOf(root);

  return (
    <div className="status">
      <span className="status-cell"><span className="dim">root</span> <span className="accent">{(overall * 100).toFixed(2)}%</span></span>
      <span className="status-sep" />
      <span className="status-cell"><span className="dim">tasks</span> {doneTasks}/{totalTasks}</span>
      <span className="status-sep" />
      <span className="status-cell"><span className="dim">nodes</span> {totalNodes}</span>
      <span className="status-spacer" />
      <span className="status-cell"><span className="dim">scope</span> {focus.name}</span>
      <span className="status-sep" />
      <span className="status-cell mono-tight">{formatTime(t)}</span>
    </div>
  );
}

function Breadcrumb({ path, onJump }) {
  return (
    <div className="crumb">
      {path.map((n, i) => (
        <React.Fragment key={n.id}>
          {i > 0 && <span className="crumb-slash">/</span>}
          <button className={`crumb-seg${i === path.length - 1 ? " is-cur" : ""}`}
                  onClick={() => onJump(n.id)}>
            {n.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

function App() {
  const [root, setRoot] = React.useState(() => window.SEED_ROOT);
  const [focusId, setFocusId] = React.useState("root");
  const [expanded, setExpanded] = React.useState(() => new Set(["root", "craft", "body", "mind", "bond"]));
  const [editId, setEditId] = React.useState(null);
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyAccent(t.accent); }, [t.accent]);

  const found = window.findById(root, focusId) || window.findById(root, "root");
  const focus = found.node;
  const focusPath = found.path;
  const editNode = editId ? window.findById(root, editId)?.node : null;

  const handleFocus = (id) => {
    setFocusId(id);
    const f = window.findById(root, id);
    if (f) setExpanded((s) => new Set([...s, ...f.path.map((n) => n.id)]));
  };
  const handleToggleTask = (taskId) => setRoot((r) => window.toggleTask(r, taskId));
  const handleAddChild = (parentId, child) => {
    setRoot((r) => window.addChild(r, parentId, child));
    setExpanded((s) => new Set([...s, parentId]));
  };
  const handleAddTask = (id, task) => setRoot((r) => window.addTask(r, id, task));
  const handleUpdate = (id, updater) => setRoot((r) => window.updateNode(r, id, updater));
  const handleRemove = (id) => {
    setRoot((r) => window.removeNode(r, id));
    if (focusId === id) setFocusId("root");
  };
  const handleRemoveTask = (taskId) => setRoot((r) => window.removeTask(r, taskId));
  const toggleExpand = (id) => setExpanded((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setEditId(null);
      if (e.key === "Backspace" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        if (focusPath.length > 1) setFocusId(focusPath[focusPath.length - 2].id);
      }
      if (e.key === "[" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) setLeftOpen((v) => !v);
      if (e.key === "]" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) setRightOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusPath]);

  const mainCls = [
    "main",
    leftOpen ? "" : "no-left",
    rightOpen ? "" : "no-right"
  ].filter(Boolean).join(" ");

  return (
    <div className={`app density-${t.density} ${t.scanlines ? "scanlines" : ""} ${t.noise ? "noise" : ""} ${t.vignette ? "vignette" : ""}`}>
      <header className="top">
        <div className="logo">
          <span className="logo-mark">◐</span>
          <span className="logo-name">gradatim</span>
        </div>
        <Breadcrumb path={focusPath} onJump={handleFocus} />
        <div className="top-actions">
          <button className="ghost-btn" onClick={() => setEditId(focus.id)}>edit</button>
        </div>
      </header>

      <main className={mainCls}>
        {leftOpen ? (
          <aside className="pane pane-l">
            <window.IdentityTree
              root={root}
              focusId={focusId}
              expanded={expanded}
              onToggleExpand={toggleExpand}
              onFocus={handleFocus}
            />
            <button className="pane-collapse left"
                    onClick={() => setLeftOpen(false)}
                    aria-label="hide identity tree"
                    title="hide (key: [)">‹</button>
          </aside>
        ) : (
          <button className="pane-rail left"
                  onClick={() => setLeftOpen(true)}
                  aria-label="show identity tree"
                  title="show identities (key: [)">
            <span className="pane-rail-chev">›</span>
            <span className="pane-rail-label">identities</span>
          </button>
        )}

        <section className="pane pane-c">
          <window.CoreViz
            focus={focus}
            focusPath={focusPath}
            onSelect={handleFocus}
            pulseSpeed={t.pulseSpeed}
            showFragments={t.showFragments}
          />
        </section>

        {rightOpen ? (
          <aside className="pane pane-r">
            <window.AnalysisPanel
              root={root}
              focus={focus}
              onSelectIdentity={handleFocus}
              onToggleTask={handleToggleTask}
              onOpenIdentity={(id) => setEditId(id)}
            />
            <button className="pane-collapse right"
                    onClick={() => setRightOpen(false)}
                    aria-label="hide analysis"
                    title="hide (key: ])">›</button>
          </aside>
        ) : (
          <button className="pane-rail right"
                  onClick={() => setRightOpen(true)}
                  aria-label="show analysis"
                  title="show analysis (key: ])">
            <span className="pane-rail-chev">‹</span>
            <span className="pane-rail-label">analysis</span>
          </button>
        )}
      </main>

      <StatusBar root={root} focus={focus} />

      {editNode && (
        <window.IdentityModal
          root={root}
          node={editNode}
          onClose={() => setEditId(null)}
          onUpdate={handleUpdate}
          onAddChild={handleAddChild}
          onAddTask={handleAddTask}
          onRemove={handleRemove}
          onRemoveTask={handleRemoveTask}
          onToggleTask={handleToggleTask}
          onFocus={(id) => { handleFocus(id); setEditId(id); }}
        />
      )}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Aesthetic">
          <window.TweakSelect
            label="Accent" value={t.accent}
            options={["neutral", "ice", "phosphor", "amber", "cyan", "magenta"]}
            onChange={(v) => setTweak("accent", v)} />
          <window.TweakRadio
            label="Pulse" value={t.pulseSpeed}
            options={["slow", "med", "fast"]}
            onChange={(v) => setTweak("pulseSpeed", v)} />
          <window.TweakRadio
            label="Density" value={t.density}
            options={["compact", "regular", "comfy"]}
            onChange={(v) => setTweak("density", v)} />
        </window.TweakSection>
        <window.TweakSection label="Effects">
          <window.TweakToggle label="Scanlines" value={t.scanlines}
            onChange={(v) => setTweak("scanlines", v)} />
          <window.TweakToggle label="Noise" value={t.noise}
            onChange={(v) => setTweak("noise", v)} />
          <window.TweakToggle label="Vignette" value={t.vignette}
            onChange={(v) => setTweak("vignette", v)} />
        </window.TweakSection>
        <window.TweakSection label="Visualization">
          <window.TweakToggle label="Show fragments" value={t.showFragments}
            onChange={(v) => setTweak("showFragments", v)} />
        </window.TweakSection>
        <window.TweakSection label="Panes">
          <window.TweakToggle label="Identity tree" value={leftOpen}
            onChange={setLeftOpen} />
          <window.TweakToggle label="Analysis" value={rightOpen}
            onChange={setRightOpen} />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
