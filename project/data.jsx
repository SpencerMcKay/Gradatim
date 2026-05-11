// data.jsx — seed identities + computation helpers
// Hierarchical identity model:
//   identity = { id, name, description, weight, color, children[], tasks[] }
//   weight is the share of its PARENT's mass it occupies
//   color  is an optional hue (0–360). If null/missing, inherits from nearest
//          ancestor that has one; if no ancestor has one either, falls back to
//          the globally-selected accent.
//   tasks  = { id, name, impact, effort, done }
//
// Progress is computed bottom-up by blending two masses:
//   taskMass  = Σ task.impact      (own leaf-level effort)
//   childMass = Σ child.weight     (delegated to sub-identities)
//   progress  = (Σ doneImpact + Σ child.weight * child.progress) / (taskMass + childMass)

const SEED_ROOT = {
  id: "root",
  name: "self.becoming",
  description: "the integrated person under construction — the converged target of all sub-identities below.",
  weight: 100,
  tasks: [],
  children: [
    {
      id: "craft",
      name: "craft",
      description: "the engineer who ships work that compounds. taste, depth, restraint.",
      weight: 32,
      color: 150,
      tasks: [],
      children: [
        { id: "craft.systems", name: "systems_thinker", description: "sees second-order effects, designs from first principles.", weight: 35, children: [], tasks: [
          { id: "t1", name: "finish DDIA ch.5–9", impact: 8, effort: 5, done: true },
          { id: "t2", name: "redesign storage layer notes", impact: 9, effort: 6, done: false },
          { id: "t3", name: "audit own arch vs known patterns", impact: 7, effort: 4, done: false },
          { id: "t4", name: "write 'failure modes' essay", impact: 8, effort: 5, done: false } ] },
        { id: "craft.writing", name: "writes_clearly", description: "leaves a paper trail. communicates compounding ideas.", weight: 25, children: [], tasks: [
          { id: "t5", name: "publish 2 internal essays", impact: 9, effort: 8, done: false },
          { id: "t6", name: "weekly dev journal", impact: 6, effort: 2, done: true },
          { id: "t7", name: "rewrite README of main project", impact: 7, effort: 3, done: true } ] },
        { id: "craft.ship", name: "ships_things", description: "finishes. owns the boring last 20%.", weight: 40, children: [], tasks: [
          { id: "t8", name: "release v2 of main project", impact: 10, effort: 9, done: false },
          { id: "t9", name: "cut WIP to ≤2 in-flight", impact: 8, effort: 3, done: false },
          { id: "t10", name: "automate release pipeline", impact: 7, effort: 6, done: true } ] }
      ]
    },
    {
      id: "body",
      name: "body",
      description: "the durable, mobile, well-conditioned animal that carries everything else.",
      weight: 24,
      color: 30,
      tasks: [],
      children: [
        { id: "body.str", name: "strength", description: "lifts more than last quarter, never less.", weight: 30, children: [], tasks: [
          { id: "t11", name: "bench 1.25× bodyweight", impact: 9, effort: 8, done: false },
          { id: "t12", name: "lift 3× weekly", impact: 8, effort: 6, done: true } ] },
        { id: "body.cardio", name: "endurance", description: "zone-2 base. can run an hour without thinking.", weight: 28, children: [], tasks: [
          { id: "t13", name: "sub-20 5k", impact: 9, effort: 8, done: false },
          { id: "t14", name: "zone-2 90 min/week", impact: 7, effort: 5, done: true } ] },
        { id: "body.rec", name: "recovery", description: "sleeps deep. mobility maintained.", weight: 42, children: [], tasks: [
          { id: "t15", name: "7.5h sleep avg, 30 days", impact: 10, effort: 7, done: false },
          { id: "t16", name: "mobility 10 min daily", impact: 6, effort: 2, done: false },
          { id: "t17", name: "blackout bedroom", impact: 7, effort: 2, done: true } ] }
      ]
    },
    {
      id: "mind",
      name: "mind",
      description: "sharp, calm, deeply read. metabolizes ideas instead of consuming them.",
      weight: 20,
      color: 230,
      tasks: [],
      children: [
        { id: "mind.read", name: "deep_reader", description: "one book per fortnight. notes that survive.", weight: 40, children: [], tasks: [
          { id: "t18", name: "1 book / 2 weeks (Q-end)", impact: 8, effort: 5, done: false },
          { id: "t19", name: "commonplace book habit", impact: 7, effort: 3, done: true } ] },
        { id: "mind.still", name: "stillness", description: "quiet inside. not reactive.", weight: 35, children: [], tasks: [
          { id: "t20", name: "meditate 5×/week", impact: 9, effort: 4, done: false },
          { id: "t21", name: "phone-free mornings", impact: 8, effort: 6, done: false } ] },
        { id: "mind.refl", name: "reflective", description: "metabolizes own experience. weekly review.", weight: 25, children: [], tasks: [
          { id: "t22", name: "weekly review (sun pm)", impact: 7, effort: 2, done: true },
          { id: "t23", name: "monthly retrospective", impact: 6, effort: 3, done: false } ] }
      ]
    },
    {
      id: "bond",
      name: "bond",
      description: "the present, generous person to the people that matter.",
      weight: 24,
      color: 330,
      tasks: [],
      children: [
        { id: "bond.partner", name: "partner", description: "first priority. attention, not residue.", weight: 45, children: [], tasks: [
          { id: "t24", name: "weekly date night", impact: 10, effort: 4, done: true },
          { id: "t25", name: "no-phone evenings 3×/wk", impact: 9, effort: 6, done: false } ] },
        { id: "bond.fam", name: "family", description: "shows up. consistent across distance.", weight: 25, children: [], tasks: [
          { id: "t26", name: "call parents weekly", impact: 8, effort: 2, done: true },
          { id: "t27", name: "plan summer visit", impact: 7, effort: 5, done: false } ] },
        { id: "bond.friends", name: "friends", description: "few, deep. invests time, not pings.", weight: 30, children: [], tasks: [
          { id: "t28", name: "host monthly dinner", impact: 9, effort: 6, done: false },
          { id: "t29", name: "1 deep convo / week", impact: 8, effort: 3, done: true } ] }
      ]
    }
  ]
};

// ── helpers ──────────────────────────────────────────────────────────────

// Curated palette of hues for the color picker.
const HUE_PALETTE = [
  { name: "red",     hue: 25  },
  { name: "amber",   hue: 70  },
  { name: "lime",    hue: 120 },
  { name: "green",   hue: 150 },
  { name: "teal",    hue: 180 },
  { name: "cyan",    hue: 210 },
  { name: "blue",    hue: 250 },
  { name: "violet",  hue: 285 },
  { name: "magenta", hue: 320 }
];

// Walk a path of ancestors (root → … → node) and return the first hue found,
// closest to the node first. Returns null if nothing is set anywhere.
function resolveHue(path) {
  for (let i = path.length - 1; i >= 0; i--) {
    const h = path[i]?.color;
    if (h != null && !Number.isNaN(Number(h))) return Number(h);
  }
  return null;
}

function progressOf(node) {
  const tasks = node.tasks || [];
  const children = node.children || [];
  const taskMass = tasks.reduce((a, t) => a + t.impact, 0);
  const taskScore = tasks.reduce((a, t) => a + (t.done ? t.impact : 0), 0);
  const childMass = children.reduce((a, c) => a + c.weight, 0);
  const childScore = children.reduce((a, c) => a + c.weight * progressOf(c), 0);
  const total = taskMass + childMass;
  if (total === 0) return 0;
  return (taskScore + childScore) / total;
}

function findById(node, id, path = []) {
  if (node.id === id) return { node, path: [...path, node] };
  for (const c of node.children || []) {
    const r = findById(c, id, [...path, node]);
    if (r) return r;
  }
  return null;
}

// Walk tree, yielding each node with its root-relative weight share.
// weight here is "fraction of root mass this node controls".
function walkWeighted(root) {
  const out = [];
  const visit = (node, mult, path) => {
    out.push({ node, weight: mult, path });
    const childSum = (node.children || []).reduce((a, c) => a + c.weight, 0);
    for (const c of node.children || []) {
      const share = childSum > 0 ? c.weight / childSum : 0;
      visit(c, mult * share, [...path, c]);
    }
  };
  visit(root, 1, [root]);
  return out;
}

// Bottlenecks: identities with the biggest weighted progress GAP from root POV.
// Skips fully-complete nodes and the root itself.
function bottlenecks(root, n = 5) {
  const all = walkWeighted(root);
  return all
    .filter(({ node }) => node !== root)
    .map((x) => ({ ...x, progress: progressOf(x.node), gap: x.weight * (1 - progressOf(x.node)) }))
    .filter((x) => x.gap > 0.001)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, n);
}

// Top-impact incomplete tasks: rank by (root-relative-weight × task.impact) / task.effort.
// effortless wins float to top, big foundational tasks rank high too.
function topTasks(root, n = 5) {
  const all = walkWeighted(root);
  const out = [];
  for (const { node, weight, path } of all) {
    const taskMass = (node.tasks || []).reduce((a, t) => a + t.impact, 0) || 1;
    for (const task of node.tasks || []) {
      if (task.done) continue;
      // priority = how much root-progress this task unlocks per unit effort
      const rootGain = weight * (task.impact / taskMass);
      out.push({
        task, node, path,
        rootGain,
        priority: rootGain / Math.max(1, task.effort)
      });
    }
  }
  out.sort((a, b) => b.priority - a.priority);
  return out.slice(0, n);
}

// Tree mutation helpers — return a NEW root so React re-renders cleanly.
function mapTree(node, fn) {
  const mapped = fn(node) || node;
  if (mapped.children) {
    return { ...mapped, children: mapped.children.map((c) => mapTree(c, fn)) };
  }
  return mapped;
}

function updateNode(root, id, updater) {
  return mapTree(root, (n) => (n.id === id ? { ...n, ...updater(n) } : n));
}

function toggleTask(root, taskId) {
  return mapTree(root, (n) => {
    if (!n.tasks || !n.tasks.some((t) => t.id === taskId)) return n;
    return { ...n, tasks: n.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) };
  });
}

function addChild(root, parentId, child) {
  return mapTree(root, (n) => (n.id === parentId
    ? { ...n, children: [...(n.children || []), child] }
    : n));
}

function addTask(root, identityId, task) {
  return mapTree(root, (n) => (n.id === identityId
    ? { ...n, tasks: [...(n.tasks || []), task] }
    : n));
}

function removeNode(root, id) {
  if (root.id === id) return root; // never delete root
  return mapTree(root, (n) => (n.children
    ? { ...n, children: n.children.filter((c) => c.id !== id) }
    : n));
}

function removeTask(root, taskId) {
  return mapTree(root, (n) => (n.tasks
    ? { ...n, tasks: n.tasks.filter((t) => t.id !== taskId) }
    : n));
}

Object.assign(window, {
  SEED_ROOT, HUE_PALETTE, resolveHue, progressOf, findById, walkWeighted, bottlenecks, topTasks,
  updateNode, toggleTask, addChild, addTask, removeNode, removeTask
});
