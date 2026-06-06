import './style.css';
import rawData from '../data.json';
import type { StruneNode } from './types';

const DATA = rawData as unknown as StruneNode[];

/** Display name with the documented fallback to id. */
const labelOf = (n: StruneNode): string => n.label ?? n.id;

/* index */
const byId = new Map<string, StruneNode>(DATA.map((n) => [n.id, n]));
const rev = new Map<string, string[]>(DATA.map((n) => [n.id, []]));
for (const n of DATA) for (const r of n.references) rev.get(r)!.push(n.id);

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const wires = document.getElementById('wires') as unknown as SVGSVGElement;
const board = $('board');
const leftList = $('leftList');
const rightList = $('rightList');

let current: string | null = null;
const history: string[] = [];
const trail: string[] = [];

/* stats + search datalist */
$('stats').innerHTML =
  `<b>${DATA.length}</b> NODES<br><b>${DATA.reduce((a, n) => a + n.references.length, 0)}</b> EDGES`;
const dl = $('nodeList');
for (const n of [...DATA].sort((a, b) => labelOf(a).localeCompare(labelOf(b)))) {
  const o = document.createElement('option');
  o.value = labelOf(n);
  dl.appendChild(o);
}

function makeNode(id: string, idx: number): HTMLDivElement {
  const n = byId.get(id)!;
  const el = document.createElement('div');
  el.className = 'node';
  el.dataset.id = id;
  el.style.animationDelay = Math.min(idx * 28, 280) + 'ms';
  el.innerHTML = `<div class="lbl"></div><div class="id"></div>`;
  (el.querySelector('.lbl') as HTMLElement).textContent = labelOf(n);
  (el.querySelector('.id') as HTMLElement).textContent = n.id;
  el.title = n.description ?? '';
  el.addEventListener('click', () => go(id));
  return el;
}

function emptyEl(): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'empty';
  d.textContent = '— なし —';
  return d;
}

function render(id: string): void {
  current = id;
  const n = byId.get(id)!;
  const ins = [...rev.get(id)!].sort((a, b) =>
    labelOf(byId.get(a)!).localeCompare(labelOf(byId.get(b)!)),
  );
  const outs = n.references;

  $('centerLabel').textContent = labelOf(n);
  $('centerId').textContent = n.id;
  $('centerDesc').textContent = n.description ?? '';
  $('cntIn').textContent = String(ins.length);
  $('cntOut').textContent = String(outs.length);

  leftList.replaceChildren(
    ...(ins.length ? ins.map((x, i) => makeNode(x, i)) : [emptyEl()]),
  );
  rightList.replaceChildren(
    ...(outs.length ? outs.map((x, i) => makeNode(x, i)) : [emptyEl()]),
  );

  renderTrail();
  ($('backBtn') as HTMLButtonElement).disabled = history.length === 0;
  requestAnimationFrame(drawWires);
  setTimeout(drawWires, 360); /* after rise animation settles */
}

function go(id: string, pushHist = true): void {
  if (id === current) return;
  if (pushHist && current) history.push(current);
  trail.push(id);
  if (trail.length > 6) trail.shift();
  render(id);
}

($('backBtn') as HTMLButtonElement).addEventListener('click', () => {
  if (!history.length) return;
  const prev = history.pop()!;
  trail.push(prev);
  if (trail.length > 6) trail.shift();
  render(prev);
});

function renderTrail(): void {
  const t = $('trail');
  t.replaceChildren();
  trail.forEach((id, i) => {
    if (i > 0) {
      const s = document.createElement('span');
      s.className = 'sep';
      s.textContent = '›';
      t.appendChild(s);
    }
    const s = document.createElement('span');
    s.textContent = labelOf(byId.get(id)!);
    if (i === trail.length - 1) s.className = 'here';
    else s.addEventListener('click', () => go(id));
    t.appendChild(s);
  });
}

/* search */
($('searchBox') as HTMLInputElement).addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  const v = input.value.trim().toLowerCase();
  const hit =
    DATA.find((n) => labelOf(n).toLowerCase() === v) ?? DATA.find((n) => n.id === v);
  if (hit) {
    go(hit.id);
    input.value = '';
    input.blur();
  }
});

/* ── wires ──────────────────────────── */
function drawWires(): void {
  const bw = board.clientWidth,
    bh = board.clientHeight;
  wires.setAttribute('viewBox', `0 0 ${bw} ${bh}`);
  wires.setAttribute('width', String(bw));
  wires.setAttribute('height', String(bh));
  const bRect = board.getBoundingClientRect();
  const cRect = $('centerCard').getBoundingClientRect();
  const cy = cRect.top - bRect.top + cRect.height / 2;
  const cxL = cRect.left - bRect.left;
  const cxR = cRect.right - bRect.left;

  let svg = `<defs>
    <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0.6 L7.4,4 L0,7.4" fill="none" stroke="#7e9eff" stroke-width="1.4"/>
    </marker>
    <filter id="wglow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  const seg = (
    items: NodeListOf<Element>,
    container: HTMLElement,
    toLeftSide: boolean,
  ): void => {
    const contRect = container.getBoundingClientRect();
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < contRect.top + 4 || r.top > contRect.bottom - 4) continue; /* scrolled out */
      const y = r.top - bRect.top + r.height / 2;
      if (toLeftSide) {
        /* left item -> center (arrow at center) */
        const x1 = r.right - bRect.left,
          x2 = cxL - 4;
        const mx = (x1 + x2) / 2;
        svg += `<path d="M${x1},${y} C${mx},${y} ${mx},${cy} ${x2},${cy}" fill="none" stroke="#7e9eff" stroke-opacity=".45" stroke-width="1.4" marker-end="url(#arrow)" filter="url(#wglow)"/>`;
      } else {
        /* center -> right item (arrow at item) */
        const x1 = cxR + 4,
          x2 = r.left - bRect.left;
        const mx = (x1 + x2) / 2;
        svg += `<path d="M${x1},${cy} C${mx},${cy} ${mx},${y} ${x2},${y}" fill="none" stroke="#7e9eff" stroke-opacity=".45" stroke-width="1.4" marker-end="url(#arrow)" filter="url(#wglow)"/>`;
      }
    }
  };
  seg(leftList.querySelectorAll('.node'), leftList, true);
  seg(rightList.querySelectorAll('.node'), rightList, false);
  wires.innerHTML = svg;
}

leftList.addEventListener('scroll', () => requestAnimationFrame(drawWires));
rightList.addEventListener('scroll', () => requestAnimationFrame(drawWires));
window.addEventListener('resize', () => requestAnimationFrame(drawWires));

/* boot */
go('game-engine');
