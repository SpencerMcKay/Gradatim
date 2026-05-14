// panels.jsx — minimal versions of tree, analysis, modal.

// ── Identity tree ───────────────────────────────────────────────────────────
function IdentityTree({
  root,
  focusId,
  expanded,
  onToggleExpand,
  onFocus
}) {
  const renderNode = (node, depth = 0) => {
    const open = expanded.has(node.id);
    const kids = node.children || [];
    const hasKids = kids.length > 0;
    const prog = window.progressOf(node);
    const isFocus = focusId === node.id;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: node.id
    }, /*#__PURE__*/React.createElement("div", {
      className: `tree-row${isFocus ? " is-focus" : ""}`,
      style: {
        paddingLeft: `${8 + depth * 14}px`
      },
      onClick: () => onFocus(node.id)
    }, /*#__PURE__*/React.createElement("button", {
      className: "tree-disc",
      onClick: e => {
        e.stopPropagation();
        if (hasKids) onToggleExpand(node.id);
      },
      "aria-label": hasKids ? open ? "collapse" : "expand" : "leaf"
    }, hasKids ? open ? "−" : "+" : "·"), /*#__PURE__*/React.createElement("span", {
      className: "tree-name"
    }, node.name), /*#__PURE__*/React.createElement("span", {
      className: "tree-pct"
    }, (prog * 100).toFixed(0), /*#__PURE__*/React.createElement("span", {
      className: "tree-pct-unit"
    }, "%"))), open && hasKids && kids.map(c => renderNode(c, depth + 1)));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "tree"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pane-hd"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pane-hd-name"
  }, "identities"), /*#__PURE__*/React.createElement("span", {
    className: "pane-hd-meta"
  }, countNodes(root))), /*#__PURE__*/React.createElement("div", {
    className: "tree-body"
  }, renderNode(root)));
}
function countNodes(n) {
  return 1 + (n.children || []).reduce((a, c) => a + countNodes(c), 0);
}

// ── Right rail: analysis ────────────────────────────────────────────────────
function AnalysisPanel({
  root,
  focus,
  onSelectIdentity,
  onToggleTask,
  onOpenIdentity
}) {
  const tasks = React.useMemo(() => window.topTasks(focus, 6), [focus]);
  const bot = React.useMemo(() => window.bottlenecks(focus, 6), [focus]);
  return /*#__PURE__*/React.createElement("div", {
    className: "analysis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pane-hd"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pane-hd-name"
  }, "analysis"), /*#__PURE__*/React.createElement("span", {
    className: "pane-hd-meta"
  }, focus.name)), /*#__PURE__*/React.createElement("div", {
    className: "ana-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ana-section-hd"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ana-section-title"
  }, "leverage"), /*#__PURE__*/React.createElement("span", {
    className: "ana-section-sub"
  }, "impact \xD7 weight \xF7 effort")), /*#__PURE__*/React.createElement("div", {
    className: "ana-list"
  }, tasks.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "ana-empty"
  }, "no open tasks in scope"), tasks.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.task.id,
    className: "ana-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ana-check",
    onClick: () => onToggleTask(t.task.id),
    "aria-label": "complete"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ana-check-box"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ana-row-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ana-row-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ana-name"
  }, t.task.name), /*#__PURE__*/React.createElement("span", {
    className: "ana-gain"
  }, "+", (t.rootGain * 100).toFixed(1), "%")), /*#__PURE__*/React.createElement("div", {
    className: "ana-row-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ana-path",
    onClick: () => onSelectIdentity(t.node.id)
  }, t.path.slice(1).map(n => n.name).join(" / ") || t.node.name), /*#__PURE__*/React.createElement("span", {
    className: "ana-stats"
  }, /*#__PURE__*/React.createElement("span", null, "i", t.task.impact), /*#__PURE__*/React.createElement("span", null, "e", t.task.effort))), /*#__PURE__*/React.createElement("div", {
    className: "ana-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ana-bar-fill",
    style: {
      width: `${Math.min(100, t.priority * 250)}%`
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "ana-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ana-section-hd"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ana-section-title"
  }, "bottlenecks"), /*#__PURE__*/React.createElement("span", {
    className: "ana-section-sub"
  }, "weight \xD7 gap")), /*#__PURE__*/React.createElement("div", {
    className: "ana-list"
  }, bot.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "ana-empty"
  }, "no bottlenecks in scope"), bot.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.node.id,
    className: "ana-row ana-row-bot",
    onClick: () => onSelectIdentity(b.node.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "ana-row-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ana-row-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ana-name"
  }, b.node.name), /*#__PURE__*/React.createElement("span", {
    className: "ana-gain warn"
  }, (b.gap * 100).toFixed(1), "%")), /*#__PURE__*/React.createElement("div", {
    className: "ana-row-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ana-path"
  }, b.path.slice(1).map(n => n.name).join(" / ") || "—"), /*#__PURE__*/React.createElement("span", {
    className: "ana-stats"
  }, /*#__PURE__*/React.createElement("span", null, "w", (b.weight * 100).toFixed(1), "%"), /*#__PURE__*/React.createElement("button", {
    className: "ana-edit",
    onClick: e => {
      e.stopPropagation();
      onOpenIdentity(b.node.id);
    }
  }, "edit"))), /*#__PURE__*/React.createElement("div", {
    className: "ana-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ana-bar-fill warn",
    style: {
      width: `${(b.progress * 100).toFixed(1)}%`
    }
  }))))))));
}

// ── Identity detail modal ───────────────────────────────────────────────────
function IdentityModal({
  root,
  node,
  onClose,
  onUpdate,
  onAddChild,
  onAddTask,
  onRemove,
  onRemoveTask,
  onToggleTask,
  onFocus
}) {
  const [name, setName] = React.useState(node.name);
  const [description, setDescription] = React.useState(node.description || "");
  const [weight, setWeight] = React.useState(node.weight);
  React.useEffect(() => {
    setName(node.name);
    setDescription(node.description || "");
    setWeight(node.weight);
  }, [node.id]);
  const [newChild, setNewChild] = React.useState({
    name: "",
    weight: 20
  });
  const [newTask, setNewTask] = React.useState({
    name: "",
    impact: 7,
    effort: 3
  });
  const prog = window.progressOf(node);
  const isRoot = node.id === root.id;
  const commit = () => onUpdate(node.id, () => ({
    name,
    description,
    weight: Number(weight) || 0
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-hd"
  }, /*#__PURE__*/React.createElement("span", {
    className: "modal-hd-label"
  }, "identity"), /*#__PURE__*/React.createElement("span", {
    className: "modal-hd-name"
  }, node.name), /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "name"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    onBlur: commit,
    className: "inp"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "weight ", /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, !isRoot && "(within parent)")), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: weight,
    disabled: isRoot,
    onChange: e => setWeight(e.target.value),
    onBlur: commit,
    className: "inp"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld fld-wide"
  }, /*#__PURE__*/React.createElement("label", null, "description"), /*#__PURE__*/React.createElement("textarea", {
    value: description,
    onChange: e => setDescription(e.target.value),
    onBlur: commit,
    rows: 2,
    className: "inp"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "progress"), /*#__PURE__*/React.createElement("div", {
    className: "meter"
  }, /*#__PURE__*/React.createElement("div", {
    className: "meter-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "meter-fill",
    style: {
      width: `${prog * 100}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "meter-val"
  }, (prog * 100).toFixed(1), "%"))), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "actions"), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => onFocus(node.id)
  }, "focus"), !isRoot && /*#__PURE__*/React.createElement("button", {
    className: "btn warn",
    onClick: () => {
      if (confirm(`remove ${node.name}?`)) {
        onRemove(node.id);
        onClose();
      }
    }
  }, "remove")))), /*#__PURE__*/React.createElement("div", {
    className: "modal-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-section-hd"
  }, /*#__PURE__*/React.createElement("span", null, "sub-identities"), /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, (node.children || []).length)), /*#__PURE__*/React.createElement("div", {
    className: "rowlist"
  }, (node.children || []).map(c => {
    const cp = window.progressOf(c);
    return /*#__PURE__*/React.createElement("div", {
      className: "rl-row",
      key: c.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "rl-name",
      onClick: () => onFocus(c.id)
    }, c.name), /*#__PURE__*/React.createElement("span", {
      className: "dim small"
    }, "w", c.weight), /*#__PURE__*/React.createElement("div", {
      className: "rl-bar"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rl-bar-fill",
      style: {
        width: `${cp * 100}%`
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "rl-pct"
    }, (cp * 100).toFixed(0), "%"), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      onClick: () => {
        if (confirm(`remove ${c.name}?`)) onRemove(c.id);
      }
    }, "\xD7"));
  })), /*#__PURE__*/React.createElement("div", {
    className: "addrow"
  }, /*#__PURE__*/React.createElement("input", {
    className: "inp inp-sm",
    placeholder: "new sub-identity",
    value: newChild.name,
    onChange: e => setNewChild({
      ...newChild,
      name: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "inp inp-sm",
    placeholder: "w",
    style: {
      width: 60
    },
    value: newChild.weight,
    onChange: e => setNewChild({
      ...newChild,
      weight: Number(e.target.value)
    })
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    disabled: !newChild.name.trim(),
    onClick: () => {
      const id = `${node.id}.${newChild.name.trim().toLowerCase().replace(/\s+/g, "_")}.${Date.now().toString(36).slice(-4)}`;
      onAddChild(node.id, {
        id,
        name: newChild.name.trim(),
        description: "",
        weight: newChild.weight,
        children: [],
        tasks: []
      });
      setNewChild({
        name: "",
        weight: 20
      });
    }
  }, "add"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-section-hd"
  }, /*#__PURE__*/React.createElement("span", null, "tasks"), /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, (node.tasks || []).filter(t => !t.done).length, " open \xB7 ", (node.tasks || []).length, " total")), /*#__PURE__*/React.createElement("div", {
    className: "rowlist"
  }, (node.tasks || []).map(t => /*#__PURE__*/React.createElement("div", {
    className: "rl-row",
    key: t.id
  }, /*#__PURE__*/React.createElement("button", {
    className: "rl-check",
    onClick: () => onToggleTask(t.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: `rl-check-box ${t.done ? "is-done" : ""}`
  })), /*#__PURE__*/React.createElement("span", {
    className: `rl-name ${t.done ? "done" : ""}`
  }, t.name), /*#__PURE__*/React.createElement("span", {
    className: "dim small"
  }, "i", t.impact, " e", t.effort), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn",
    onClick: () => onRemoveTask(t.id)
  }, "\xD7"))), (node.tasks || []).length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "ana-empty"
  }, "no tasks yet")), /*#__PURE__*/React.createElement("div", {
    className: "addrow"
  }, /*#__PURE__*/React.createElement("input", {
    className: "inp inp-sm",
    placeholder: "new task",
    value: newTask.name,
    onChange: e => setNewTask({
      ...newTask,
      name: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "inp inp-sm",
    placeholder: "i",
    min: 1,
    max: 10,
    style: {
      width: 44
    },
    value: newTask.impact,
    onChange: e => setNewTask({
      ...newTask,
      impact: Number(e.target.value)
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "inp inp-sm",
    placeholder: "e",
    min: 1,
    max: 10,
    style: {
      width: 44
    },
    value: newTask.effort,
    onChange: e => setNewTask({
      ...newTask,
      effort: Number(e.target.value)
    })
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    disabled: !newTask.name.trim(),
    onClick: () => {
      const id = `t.${Date.now().toString(36)}`;
      onAddTask(node.id, {
        id,
        name: newTask.name.trim(),
        impact: newTask.impact,
        effort: newTask.effort,
        done: false
      });
      setNewTask({
        name: "",
        impact: 7,
        effort: 3
      });
    }
  }, "add"))))));
}
Object.assign(window, {
  IdentityTree,
  AnalysisPanel,
  IdentityModal
});