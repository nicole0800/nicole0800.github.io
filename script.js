// ===== Menu "Extra" =====
const extraBtn = document.getElementById('extraBtn');
const extraMenu = document.getElementById('extraMenu');

function chiudiMenu() { extraMenu.hidden = true; extraBtn.setAttribute('aria-expanded', 'false'); }
extraBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const aperto = !extraMenu.hidden;
  extraMenu.hidden = aperto;
  extraBtn.setAttribute('aria-expanded', String(!aperto));
});
document.addEventListener('click', (e) => { if (!extraMenu.contains(e.target)) chiudiMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') chiudiMenu(); });
extraMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  chiudiMenu();
  if (a.hasAttribute('data-open-calendar')) {
    const card = document.getElementById('calendarCard');
    card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
  }
}));

// ===== Calendario con impegni di esempio (calcolati a partire da oggi) =====
const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
const traGiorni = (n) => { const d = new Date(oggi); d.setDate(d.getDate() + n); return d; };
const chiave = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const impegni = [
  { data: traGiorni(-3), ora: '10:00', titolo: 'Riunione kickoff – Studio Rossi', tipo: 'riunione' },
  { data: traGiorni(0),  ora: '09:30', titolo: 'Rispondere a Cliente Ferri', tipo: 'promemoria' },
  { data: traGiorni(1),  ora: '11:00', titolo: 'Call con Cliente Ferri', tipo: 'chiamata' },
  { data: traGiorni(2),  ora: '18:00', titolo: 'Consegna preventivo Ferri', tipo: 'scadenza' },
  { data: traGiorni(4),  ora: '15:00', titolo: 'Revisione progetto (letto da WhatsApp)', tipo: 'riunione' },
  { data: traGiorni(4),  ora: '17:00', titolo: 'Inviare contratto firmato', tipo: 'promemoria' },
  { data: traGiorni(8),  ora: '12:00', titolo: 'Consegna lavori – Studio Rossi', tipo: 'scadenza' },
  { data: traGiorni(13), ora: '09:00', titolo: 'Pagare fattura n. 245', tipo: 'scadenza' },
  { data: traGiorni(20), ora: '14:30', titolo: 'Riunione mensile del team', tipo: 'riunione' },
];
const perGiorno = {};
impegni.forEach(i => (perGiorno[chiave(i.data)] ||= []).push(i));

let meseVisto = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
let giornoScelto = null;

const grid = document.getElementById('calGrid');
const label = document.getElementById('monthLabel');
const box = document.getElementById('dayEvents');

function disegnaCalendario() {
  label.textContent = meseVisto.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  grid.innerHTML = '';
  const anno = meseVisto.getFullYear(), mese = meseVisto.getMonth();
  const vuoti = (new Date(anno, mese, 1).getDay() + 6) % 7; // lunedì = primo giorno
  const giorniMese = new Date(anno, mese + 1, 0).getDate();

  for (let i = 0; i < vuoti; i++) {
    const v = document.createElement('span'); v.className = 'day vuoto'; grid.appendChild(v);
  }
  for (let g = 1; g <= giorniMese; g++) {
    const d = new Date(anno, mese, g);
    const btn = document.createElement('button');
    btn.className = 'day';
    btn.textContent = g;
    if (d.getTime() === oggi.getTime()) btn.classList.add('oggi');
    if (giornoScelto && d.getTime() === giornoScelto.getTime()) btn.classList.add('sel');
    const lista = perGiorno[chiave(d)];
    if (lista) {
      const dots = document.createElement('span'); dots.className = 'dots';
      lista.forEach(i => { const p = document.createElement('i'); p.className = 't-' + i.tipo; dots.appendChild(p); });
      btn.appendChild(dots);
      btn.setAttribute('aria-label', `${g}: ${lista.length} impegni`);
    }
    btn.addEventListener('click', () => scegliGiorno(d));
    grid.appendChild(btn);
  }
}

function scegliGiorno(d) {
  giornoScelto = d;
  if (d.getMonth() !== meseVisto.getMonth() || d.getFullYear() !== meseVisto.getFullYear()) {
    meseVisto = new Date(d.getFullYear(), d.getMonth(), 1);
  }
  disegnaCalendario();
  const lista = perGiorno[chiave(d)] || [];
  const titolo = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  box.innerHTML = `<h4>${titolo.charAt(0).toUpperCase() + titolo.slice(1)}</h4>` + (lista.length
    ? '<ul>' + lista.map(i => `<li><i class="t-${i.tipo}"></i><span class="ora">${i.ora}</span>${i.titolo}</li>`).join('') + '</ul>'
    : '<p class="hint">Nessun impegno in questo giorno 🎉</p>');
}

document.getElementById('prevMonth').addEventListener('click', () => { meseVisto.setMonth(meseVisto.getMonth() - 1); disegnaCalendario(); });
document.getElementById('nextMonth').addEventListener('click', () => { meseVisto.setMonth(meseVisto.getMonth() + 1); disegnaCalendario(); });

// ===== Alert: prossima scadenza =====
const alertBox = document.getElementById('alertBox');
const prossima = impegni.filter(i => i.tipo === 'scadenza' && i.data >= oggi).sort((a, b) => a.data - b.data)[0];
if (prossima) {
  const giorni = Math.round((prossima.data - oggi) / 86400000);
  const quando = giorni === 0 ? 'oggi' : giorni === 1 ? 'domani' : `tra ${giorni} giorni`;
  document.getElementById('alertText').innerHTML = `Scadenza <strong>${quando}</strong>: ${prossima.titolo}`;
  if (giorni <= 3) alertBox.classList.add('urgente');
  alertBox.addEventListener('click', () => scegliGiorno(prossima.data));
} else {
  document.getElementById('alertText').textContent = 'Nessuna scadenza imminente 👍';
}

disegnaCalendario();

// ===== Animazione di comparsa allo scroll =====
const osservatore = new IntersectionObserver((voci) => {
  voci.forEach(v => { if (v.isIntersecting) { v.target.classList.add('visibile'); osservatore.unobserve(v.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; osservatore.observe(el); });
