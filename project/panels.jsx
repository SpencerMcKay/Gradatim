// panels.jsx — minimal versions of tree, analysis, modal.

// ── Identity tree ───────────────────────────────────────────────────────────
function IdentityTree({ root, focusId, expanded, onToggleExpand, onFocus }) {
  const renderNode = (node, depth = 0) => {
    const open = expanded.has(node.id);
    const kids = node.children || [];
    const hasKids = kids.length > 0;
    const prog = window.progressOf(node);
    const isFocus = focusId === node.id;

    return (
      <React.Fragment key={node.id}>
        <div className={`tree-row${isFocus ? " is-focus" : ""}`}
             style={{ paddingLeft: `${8 + depth * 14}px` }}
             onClick={() => onFocus(node.id)}>
          <button className="tree-disc"
                  onClick={(e) => { e.stopPropagation(); if (hasKids) onToggleExpand(node.id); }}
                  aria-label={hasKids ? (open ? "collapse" : "expand") : "leaf"}>
            {hasKids ? (open ? "−" : "+") : "·"}
          </button>
          <span className="tree-name">{node.name}</span>
          <span className="tree-pct">{(prog * 100).toFixed(0)}<span className="tree-pct-unit">%</span></span>
        </div>
        {open && hasKids && kids.map((c) => renderNode(c, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="tree">
      <div className="pane-hd">
        <span className="pane-hd-name">identities</span>
        <span className="pane-hd-meta">{countNodes(root)}</span>
      </div>
      <div className="tree-body">
        {renderNode(root)}
      </div>
    </div>
  );
}

function countNodes(n) {
  return 1 + (n.children || []).reduce((a, c) => a + countNodes(c), 0);
}

// ── Right rail: analysis ────────────────────────────────────────────────────
function AnalysisPanel({ root, focus, onSelectIdentity, onToggleTask, onOpenIdentity }) {
  const tasks = React.useMemo(() => window.topTasks(focus, 6), [focus]);
  const bot = React.useMemo(() => window.bottlenecks(focus, 6), [focus]);

  return (
    <div className="analysis">
      <div className="pane-hd">
        <span className="pane-hd-name">analysis</span>
        <span className="pane-hd-meta">{focus.name}</span>
      </div>

      <div className="ana-section">
        <div className="ana-section-hd">
          <span className="ana-section-title">leverage</span>
          <span className="ana-section-sub">impact × weight ÷ effort</span>
        </div>
        <div className="ana-list">
          {tasks.length === 0 && <div className="ana-empty">no open tasks in scope</div>}
          {tasks.map((t, i) => (
            <div key={t.task.id} className="ana-row">
              <button className="ana-check" onClick={() => onToggleTask(t.task.id)} aria-label="complete">
                <span className="ana-check-box" />
              </button>
              <div className="ana-row-body">
                <div className="ana-row-top">
                  <span className="ana-name">{t.task.name}</span>
                  <span className="ana-gain">+{(t.rootGain * 100).toFixed(1)}%</span>
                </div>
                <div className="ana-row-meta">
                  <span className="ana-path" onClick={() => onSelectIdentity(t.node.id)}>
                    {t.path.slice(1).map((n) => n.name).join(" / ") || t.node.name}
                  </span>
                  <span className="ana-stats">
                    <span>i{t.task.impact}</span>
                    <span>e{t.task.effort}</span>
                  </span>
                </div>
                <div className="ana-bar">
                  <div className="ana-bar-fill" style={{ width: `${Math.min(100, t.priority * 250)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ana-section">
        <div className="ana-section-hd">
          <span className="ana-section-title">bottlenecks</span>
          <span className="ana-section-sub">weight × gap</span>
        </div>
        <div className="ana-list">
          {bot.length === 0 && <div className="ana-empty">no bottlenecks in scope</div>}
          {bot.map((b) => (
            <div key={b.node.id} className="ana-row ana-row-bot"
                 onClick={() => onSelectIdentity(b.node.id)}>
              <div className="ana-row-body">
                <div className="ana-row-top">
                  <span className="ana-name">{b.node.name}</span>
                  <span className="ana-gain warn">{(b.gap * 100).toFixed(1)}%</span>
                </div>
                <div className="ana-row-meta">
                  <span className="ana-path">{b.path.slice(1).map((n) => n.name).join(" / ") || "—"}</span>
                  <span className="ana-stats">
                    <span>w{(b.weight * 100).toFixed(1)}%</span>
                    <button className="ana-edit" onClick={(e) => { e.stopPropagation(); onOpenIdentity(b.node.id); }}>edit</button>
                  </span>
                </div>
                <div className="ana-bar">
                  <div className="ana-bar-fill warn" style={{ width: `${(b.progress * 100).toFixed(1)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Identity detail modal ───────────────────────────────────────────────────
function IdentityModal({ root, node, onClose, onUpdate, onAddChild, onAddTask, onRemove, onRemoveTask, onToggleTask, onFocus }) {
  const [name, setName] = React.useState(node.name);
  const [description, setDescription] = React.useState(node.description || "");
  const [weight, setWeight] = React.useState(node.weight);
  React.useEffect(() => {
    setName(node.name);
    setDescription(node.description || "");
    setWeight(node.weight);
  }, [node.id]);

  const [newChild, setNewChild] = React.useState({ name: "", weight: 20 });
  const [newTask, setNewTask] = React.useState({ name: "", impact: 7, effort: 3 });

  const prog = window.progressOf(node);
  const isRoot = node.id === root.id;

  const commit = () => onUpdate(node.id, () => ({ name, description, weight: Number(weight) || 0 }));

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <span className="modal-hd-label">identity</span>
          <span className="modal-hd-name">{node.name}</span>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-grid">
            <div className="fld">
              <label>name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} onBlur={commit} className="inp" />
            </div>
            <div className="fld">
              <label>weight <span className="dim">{!isRoot && "(within parent)"}</span></label>
              <input type="number" value={weight} disabled={isRoot}
                     onChange={(e) => setWeight(e.target.value)} onBlur={commit} className="inp" />
            </div>
            <div className="fld fld-wide">
              <label>description</label>
              <textarea value={description}
                        onChange={(e) => setDescription(e.target.value)} onBlur={commit}
                        rows={2} className="inp" />
            </div>
            <div className="fld">
              <label>progress</label>
              <div className="meter">
                <div className="meter-bar"><div className="meter-fill" style={{ width: `${prog * 100}%` }} /></div>
                <span className="meter-val">{(prog * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="fld">
              <label>actions</label>
              <div className="actions">
                <button className="btn" onClick={() => onFocus(node.id)}>focus</button>
                {!isRoot && (
                  <button className="btn warn" onClick={() => { if (confirm(`remove ${node.name}?`)) { onRemove(node.id); onClose(); } }}>
                    remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-hd">
              <span>sub-identities</span>
              <span className="dim">{(node.children || []).length}</span>
            </div>
            <div className="rowlist">
              {(node.children || []).map((c) => {
                const cp = window.progressOf(c);
                return (
                  <div className="rl-row" key={c.id}>
                    <span className="rl-name" onClick={() => onFocus(c.id)}>{c.name}</span>
                    <span className="dim small">w{c.weight}</span>
                    <div className="rl-bar"><div className="rl-bar-fill" style={{ width: `${cp * 100}%` }} /></div>
                    <span className="rl-pct">{(cp * 100).toFixed(0)}%</span>
                    <button className="iconbtn" onClick={() => { if (confirm(`remove ${c.name}?`)) onRemove(c.id); }}>×</button>
                  </div>
                );
              })}
            </div>
            <div className="addrow">
              <input className="inp inp-sm" placeholder="new sub-identity"
                     value={newChild.name}
                     onChange={(e) => setNewChild({ ...newChild, name: e.target.value })} />
              <input type="number" className="inp inp-sm" placeholder="w"
                     style={{ width: 60 }}
                     value={newChild.weight}
                     onChange={(e) => setNewChild({ ...newChild, weight: Number(e.target.value) })} />
              <button className="btn" disabled={!newChild.name.trim()}
                      onClick={() => {
                        const id = `${node.id}.${newChild.name.trim().toLowerCase().replace(/\s+/g, "_")}.${Date.now().toString(36).slice(-4)}`;
                        onAddChild(node.id, { id, name: newChild.name.trim(), description: "", weight: newChild.weight, children: [], tasks: [] });
                        setNewChild({ name: "", weight: 20 });
                      }}>
                add
              </button>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-hd">
              <span>tasks</span>
              <span className="dim">{(node.tasks || []).filter((t) => !t.done).length} open · {(node.tasks || []).length} total</span>
            </div>
            <div className="rowlist">
              {(node.tasks || []).map((t) => (
                <div className="rl-row" key={t.id}>
                  <button className="rl-check" onClick={() => onToggleTask(t.id)}>
                    <span className={`rl-check-box ${t.done ? "is-done" : ""}`} />
                  </button>
                  <span className={`rl-name ${t.done ? "done" : ""}`}>{t.name}</span>
                  <span className="dim small">i{t.impact} e{t.effort}</span>
                  <button className="iconbtn" onClick={() => onRemoveTask(t.id)}>×</button>
                </div>
              ))}
              {(node.tasks || []).length === 0 && <div className="ana-empty">no tasks yet</div>}
            </div>
            <div className="addrow">
              <input className="inp inp-sm" placeholder="new task"
                     value={newTask.name}
                     onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} />
              <input type="number" className="inp inp-sm" placeholder="i" min={1} max={10}
                     style={{ width: 44 }}
                     value={newTask.impact}
                     onChange={(e) => setNewTask({ ...newTask, impact: Number(e.target.value) })} />
              <input type="number" className="inp inp-sm" placeholder="e" min={1} max={10}
                     style={{ width: 44 }}
                     value={newTask.effort}
                     onChange={(e) => setNewTask({ ...newTask, effort: Number(e.target.value) })} />
              <button className="btn" disabled={!newTask.name.trim()}
                      onClick={() => {
                        const id = `t.${Date.now().toString(36)}`;
                        onAddTask(node.id, { id, name: newTask.name.trim(), impact: newTask.impact, effort: newTask.effort, done: false });
                        setNewTask({ name: "", impact: 7, effort: 3 });
                      }}>
                add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IdentityTree, AnalysisPanel, IdentityModal });
