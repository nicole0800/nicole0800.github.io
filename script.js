/* =========================================================
   UniFlow – script del sito
   1) Menu Extra   2) Calendario + Alert
   3) Demo Email → Calendario → Promemoria   4) Animazioni
   ========================================================= */

// ---------- utilità ----------
const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const GIORNI = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
const traGiorni = (n) => { const d = new Date(oggi); d.setDate(d.getDate() + n); return d; };
const chiave = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dataBreve = (d) => d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const maiuscola = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const NOME_TIPO = { scadenza: 'Scadenza', riunione: 'Riunione', chiamata: 'Chiamata', promemoria: 'Promemoria' };

// ---------- 1) Menu "Extra" ----------
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
function illuminaCalendario() {
  const card = document.getElementById('calendarCard');
  card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
}
extraMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  chiudiMenu();
  if (a.hasAttribute('data-open-calendar')) illuminaCalendario();
}));

// ---------- 2) Calendario ----------
const impegni = [
  { data: traGiorni(-3), ora: '10:00', titolo: 'Riunione kickoff – Studio Rossi', tipo: 'riunione' },
  { data: traGiorni(0),  ora: '09:30', titolo: 'Rispondere a Cliente Ferri', tipo: 'promemoria' },
  { data: traGiorni(2),  ora: '18:00', titolo: 'Consegna preventivo Ferri', tipo: 'scadenza' },
  { data: traGiorni(20), ora: '14:30', titolo: 'Riunione mensile del team', tipo: 'riunione' },
];
const nuoviGiorni = new Set();          // giorni appena aggiunti (lampeggiano)
let meseVisto = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
let giornoScelto = null;

const grid = document.getElementById('calGrid');
const monthLabel = document.getElementById('monthLabel');
const dayBox = document.getElementById('dayEvents');

function impegniDel(d) { return impegni.filter(i => chiave(i.data) === chiave(d)).sort((a, b) => a.ora.localeCompare(b.ora)); }

function disegnaCalendario() {
  monthLabel.textContent = meseVisto.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  grid.innerHTML = '';
  const anno = meseVisto.getFullYear(), mese = meseVisto.getMonth();
  const vuoti = (new Date(anno, mese, 1).getDay() + 6) % 7;   // lunedì = primo giorno
  const giorniMese = new Date(anno, mese + 1, 0).getDate();
  for (let i = 0; i < vuoti; i++) { const v = document.createElement('span'); v.className = 'day vuoto'; grid.appendChild(v); }
  for (let g = 1; g <= giorniMese; g++) {
    const d = new Date(anno, mese, g);
    const btn = document.createElement('button');
    btn.className = 'day';
    btn.textContent = g;
    if (d.getTime() === oggi.getTime()) btn.classList.add('oggi');
    if (giornoScelto && d.getTime() === giornoScelto.getTime()) btn.classList.add('sel');
    if (nuoviGiorni.has(chiave(d))) btn.classList.add('nuovo');
    const lista = impegniDel(d);
    if (lista.length) {
      const dots = document.createElement('span'); dots.className = 'dots';
      lista.slice(0, 4).forEach(i => { const p = document.createElement('i'); p.className = 't-' + i.tipo; dots.appendChild(p); });
      btn.appendChild(dots);
      btn.setAttribute('aria-label', `${g}: ${lista.length} impegni`);
    }
    btn.addEventListener('click', () => scegliGiorno(d));
    grid.appendChild(btn);
  }
}

function scegliGiorno(d) {
  giornoScelto = d;
  meseVisto = new Date(d.getFullYear(), d.getMonth(), 1);
  disegnaCalendario();
  const lista = impegniDel(d);
  const titolo = maiuscola(d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
  dayBox.innerHTML = `<h4>${titolo}</h4>` + (lista.length
    ? '<ul>' + lista.map(i => `<li><i class="t-${i.tipo}"></i><span class="ora">${i.ora}</span>${escapeHtml(i.titolo)}</li>`).join('') + '</ul>'
    : '<p class="hint">Nessun impegno in questo giorno 🎉</p>');
}

document.getElementById('prevMonth').addEventListener('click', () => { meseVisto.setMonth(meseVisto.getMonth() - 1); disegnaCalendario(); });
document.getElementById('nextMonth').addEventListener('click', () => { meseVisto.setMonth(meseVisto.getMonth() + 1); disegnaCalendario(); });

// Alert: prossima scadenza
const alertBox = document.getElementById('alertBox');
let prossimaScadenza = null;
function aggiornaAlert() {
  prossimaScadenza = impegni.filter(i => i.tipo === 'scadenza' && i.data >= oggi).sort((a, b) => a.data - b.data)[0] || null;
  const testo = document.getElementById('alertText');
  if (!prossimaScadenza) { testo.textContent = 'Nessuna scadenza imminente 👍'; alertBox.classList.remove('urgente'); return; }
  const giorni = Math.round((prossimaScadenza.data - oggi) / 86400000);
  const quando = giorni === 0 ? 'oggi' : giorni === 1 ? 'domani' : `tra ${giorni} giorni`;
  testo.innerHTML = `Scadenza <strong>${quando}</strong>: ${escapeHtml(prossimaScadenza.titolo)}`;
  alertBox.classList.toggle('urgente', giorni <= 3);
}
const apriScadenza = () => { if (prossimaScadenza) scegliGiorno(prossimaScadenza.data); };
alertBox.addEventListener('click', apriScadenza);
alertBox.addEventListener('keydown', (e) => { if (e.key === 'Enter') apriScadenza(); });

function aggiungiImpegno(imp) {
  impegni.push(imp);
  nuoviGiorni.add(chiave(imp.data));
  setTimeout(() => { nuoviGiorni.delete(chiave(imp.data)); }, 4500);
  if (imp.data.getMonth() === meseVisto.getMonth() && imp.data.getFullYear() === meseVisto.getFullYear()) disegnaCalendario();
  aggiornaAlert();
}

// ---------- 3) Lettura dei messaggi: trova data, ora, tipo e priorità ----------
function trovaData(testo) {
  const t = testo.toLowerCase();
  let data = null, inizio = -1, fine = -1, m;
  if ((m = t.match(new RegExp(`\\b(\\d{1,2})\\s+(${MESI.join('|')})(?:\\s+(\\d{4}))?`)))) {
    const anno = m[3] ? +m[3] : oggi.getFullYear();
    data = new Date(anno, MESI.indexOf(m[2]), +m[1]);
    if (!m[3] && data < oggi) data.setFullYear(anno + 1);
  } else if ((m = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
    let anno = m[3] ? +m[3] : oggi.getFullYear(); if (anno < 100) anno += 2000;
    data = new Date(anno, +m[2] - 1, +m[1]);
    if (!m[3] && data < oggi) data.setFullYear(anno + 1);
  } else if ((m = t.match(/\bdopodomani\b/))) data = traGiorni(2);
  else if ((m = t.match(/\bdomani\b/))) data = traGiorni(1);
  else if ((m = t.match(/\b(oggi|stasera|stamattina)\b/))) data = traGiorni(0);
  else if ((m = t.match(/\b(luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica)(?![a-zàèéìòù])/))) {
    const nome = m[1].replace(/i$/, 'ì');
    const target = GIORNI.indexOf(nome === 'sabato' || nome === 'domenica' ? m[1] : nome);
    data = traGiorni(((target - oggi.getDay() + 7) % 7) || 7);
  }
  if (!data || isNaN(data)) return null;
  inizio = m.index; fine = m.index + m[0].length;

  // orario (es. "alle 15", "alle 15:30", "ore 9.00")
  let ora = null;
  const o = t.slice(fine).match(/^[^.!?\n]{0,25}?\b(?:alle ore|alle|ore)\s+(\d{1,2})(?:[:.](\d{2}))?/);
  if (o && +o[1] < 24) { ora = `${o[1].padStart(2, '0')}:${o[2] || '00'}`; fine += o.index + o[0].length; }
  else {
    const prima = t.slice(0, inizio).match(/\b(?:alle ore|alle|ore)\s+(\d{1,2})(?:[:.](\d{2}))?\s*$/);
    if (prima && +prima[1] < 24) { ora = `${prima[1].padStart(2, '0')}:${prima[2] || '00'}`; inizio = prima.index; }
  }
  // includi "entro" / "entro il" nell'evidenziazione
  const entro = t.slice(0, inizio).match(/\bentro\s+(?:il\s+|la\s+|le\s+)?$/);
  if (entro) inizio = entro.index;
  return { data, ora, inizio, fine };
}

function analizza(testo) {
  const t = testo.toLowerCase();
  const trovata = trovaData(testo);
  let tipo = 'promemoria';
  if (/scaden|entro|consegn|pagare|pagat|fattur|pagamento/.test(t)) tipo = 'scadenza';
  else if (/riunion|incontr|ci vediamo|meeting|appuntament|revisione/.test(t)) tipo = 'riunione';
  else if (/\bcall\b|chiamat|telefon|videochiamat/.test(t)) tipo = 'chiamata';
  const urgente = /urgent|subito|importante|asap|al più presto/.test(t);
  let priorita = 'BASSA';
  if (trovata) {
    const giorni = Math.round((trovata.data - oggi) / 86400000);
    priorita = urgente || giorni <= 3 ? 'ALTA' : 'MEDIA';
  } else if (urgente) priorita = 'ALTA';
  return { ...trovata, trovata: !!trovata, tipo, priorita, importante: !!trovata || urgente };
}

// ---------- Messaggi di esempio (le date sono calcolate da oggi) ----------
const fmtGiorno = (n) => { const d = traGiorni(n); return `il ${d.getDate()} ${MESI[d.getMonth()]}`; };
const fmtNomeGiorno = (n) => GIORNI[traGiorni(n).getDay()];
const messaggi = [
  { id: 1, canale: 'mail', da: 'Studio Rossi', ora: '09:42', oggetto: 'Re: Progetto nuova sede',
    testo: `Approviamo il preventivo da 12.400 €. La consegna dei lavori deve avvenire entro ${fmtGiorno(8)} alle 12:00, grazie.`, titolo: 'Consegna lavori – Studio Rossi' },
  { id: 2, canale: 'wa', da: 'Marco Bianchi', ora: '09:30', oggetto: 'WhatsApp Business',
    testo: `Perfetto, allora ci vediamo ${fmtNomeGiorno(4)} alle 15:00 per la revisione del progetto.`, titolo: 'Revisione progetto con Marco' },
  { id: 3, canale: 'mail', da: 'Cliente Ferri', ora: '09:12', oggetto: 'URGENTE: errore nell\'ordine #3381',
    testo: 'C\'è un errore nell\'ordine, possiamo fare una call domani alle 11:00? È urgente.', titolo: 'Call urgente con Cliente Ferri' },
  { id: 4, canale: 'wa', da: 'Giulia (Marketing)', ora: '08:40', oggetto: 'WhatsApp Business',
    testo: 'Ho caricato le nuove grafiche nella cartella condivisa, dimmi cosa ne pensi 🙂', titolo: 'Grafiche di Giulia' },
  { id: 5, canale: 'mail', da: 'Amministrazione', ora: 'Ieri', oggetto: 'Sollecito fattura n. 245',
    testo: `Vi ricordiamo che la fattura n. 245 va pagata entro ${fmtGiorno(13)}.`, titolo: 'Pagare fattura n. 245' },
  { id: 6, canale: 'mail', da: 'Newsletter Settore', ora: 'Ieri', oggetto: 'Le novità del mese',
    testo: 'Scopri gli articoli più letti e i nuovi corsi di formazione per la tua azienda.', titolo: 'Newsletter' },
];
messaggi.forEach(m => { m.analisi = analizza(m.testo); m.segnato = false; });

const lista = document.getElementById('listaMessaggi');
let filtro = 'tutti';

function testoEvidenziato(m) {
  const a = m.analisi;
  if (!a.trovata) return escapeHtml(m.testo);
  return escapeHtml(m.testo.slice(0, a.inizio)) + '<mark>' + escapeHtml(m.testo.slice(a.inizio, a.fine)) + '</mark>' + escapeHtml(m.testo.slice(a.fine));
}

function disegnaMessaggi() {
  lista.innerHTML = messaggi.map(m => {
    const a = m.analisi;
    const visibile = filtro === 'tutti' || (filtro === 'importanti' ? a.importante : m.canale === filtro);
    return `<li class="msg ${a.importante ? 'importante' : ''} ${m.segnato ? 'segnato' : ''}" data-id="${m.id}" ${visibile ? '' : 'hidden'}>
      <span class="canale ${m.canale}" aria-label="${m.canale === 'mail' ? 'Email' : 'WhatsApp'}">${m.canale === 'mail' ? '✉️' : '💬'}</span>
      <div>
        <div class="msg-top"><strong>${escapeHtml(m.da)}</strong><time>${m.ora}</time></div>
        <p class="oggetto">${escapeHtml(m.oggetto)}</p>
        <p class="testo">${testoEvidenziato(m)}</p>
        <div class="msg-azioni">
          <span class="badge ${a.priorita}">${a.priorita}</span>
          ${a.trovata ? `<span class="data-trovata">📅 ${dataBreve(a.data)}${a.ora ? ', ' + a.ora : ''} · ${NOME_TIPO[a.tipo]}</span>` : '<span class="hint">Nessuna data trovata</span>'}
          ${a.trovata ? `<button class="btn-mini ${m.segnato ? 'fatto' : ''}" data-segna="${m.id}" ${m.segnato ? 'disabled' : ''}>${m.segnato ? '✓ Nel calendario' : '+ Segna nel calendario'}</button>` : ''}
        </div>
      </div>
    </li>`;
  }).join('');
}

lista.addEventListener('click', (e) => {
  const b = e.target.closest('[data-segna]');
  if (b) segnaMessaggio(messaggi.find(m => m.id === +b.dataset.segna), true);
});
document.querySelectorAll('.filtri .chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.filtri .chip').forEach(x => x.classList.remove('attivo'));
  c.classList.add('attivo'); filtro = c.dataset.filtro; disegnaMessaggi();
}));

// ---------- Promemoria ----------
const promemoria = [];
const listaProm = document.getElementById('listaPromemoria');
const selAnticipo = document.getElementById('anticipo');
const btnSimula = document.getElementById('simula');
const ETICHETTA_ANTICIPO = { 60: '1 ora prima', 1440: '1 giorno prima', 2880: '2 giorni prima' };

function quandoAvvisare(p) {
  const [h, min] = p.ora.split(':').map(Number);
  const evento = new Date(p.data); evento.setHours(h, min, 0, 0);
  return new Date(evento.getTime() - (+selAnticipo.value) * 60000);
}
function disegnaPromemoria() {
  if (!promemoria.length) { listaProm.innerHTML = '<li class="vuoto">Nessun promemoria ancora. Segna un messaggio nel calendario per crearne uno.</li>'; btnSimula.disabled = true; return; }
  btnSimula.disabled = false;
  const ordinati = [...promemoria].sort((a, b) => quandoAvvisare(a) - quandoAvvisare(b));
  listaProm.innerHTML = ordinati.map(p => {
    const avviso = quandoAvvisare(p);
    return `<li>
      <div class="p-titolo"><i class="t-${p.tipo}"></i>${escapeHtml(p.titolo)}</div>
      <div class="p-info">${NOME_TIPO[p.tipo]} ${dataBreve(p.data)} alle ${p.ora}<br>
        🔔 Ti avviso <b>${ETICHETTA_ANTICIPO[selAnticipo.value]}</b>: ${dataBreve(avviso)} alle ${avviso.toTimeString().slice(0, 5)}</div>
      <a href="#calendario" data-vedi="${p.data.getTime()}">Vedi nel calendario →</a>
    </li>`;
  }).join('');
}
selAnticipo.addEventListener('change', disegnaPromemoria);
listaProm.addEventListener('click', (e) => {
  const a = e.target.closest('[data-vedi]');
  if (a) { scegliGiorno(new Date(+a.dataset.vedi)); illuminaCalendario(); }
});

function segnaMessaggio(m, conToast) {
  if (!m || m.segnato || !m.analisi.trovata) return;
  m.segnato = true;
  const a = m.analisi;
  const imp = { data: a.data, ora: a.ora || '09:00', titolo: m.titolo, tipo: a.tipo };
  aggiungiImpegno(imp);
  promemoria.push(imp);
  disegnaMessaggi(); disegnaPromemoria();
  if (conToast) toast('📅', 'Segnato nel calendario', `${m.titolo} · ${dataBreve(imp.data)} alle ${imp.ora}`);
}

// Analizza tutto, un messaggio alla volta (con effetto "scansione")
const btnTutto = document.getElementById('analizzaTutto');
btnTutto.addEventListener('click', async () => {
  btnTutto.disabled = true;
  let aggiunti = 0;
  for (const m of messaggi) {
    const li = lista.querySelector(`[data-id="${m.id}"]`);
    if (li) { li.classList.add('scansione'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    await new Promise(r => setTimeout(r, 450));
    if (m.analisi.trovata && !m.segnato) { segnaMessaggio(m, false); aggiunti++; }
    else if (li) li.classList.remove('scansione');
  }
  toast('⚡', aggiunti ? `${aggiunti} impegni segnati nel calendario` : 'Tutto già segnato',
        aggiunti ? 'Ho creato anche i promemoria prima di ogni scadenza.' : 'Non ci sono nuovi messaggi con date.');
  btnTutto.textContent = '✓ Inbox analizzata';
});

// ---------- Notifiche ----------
function toast(ico, titolo, testo) {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="t-ico">${ico}</span><div><strong>${escapeHtml(titolo)}</strong><span>${escapeHtml(testo)}</span></div>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('esci'); setTimeout(() => el.remove(), 300); }, 4500);
}
const btnNotifiche = document.getElementById('attivaNotifiche');
function aggiornaBottoneNotifiche() {
  if (!('Notification' in window)) { btnNotifiche.textContent = '🔕 Notifiche non supportate'; btnNotifiche.disabled = true; }
  else if (Notification.permission === 'granted') { btnNotifiche.textContent = '✓ Notifiche attive'; btnNotifiche.disabled = true; }
  else if (Notification.permission === 'denied') { btnNotifiche.textContent = '🔕 Notifiche bloccate'; btnNotifiche.disabled = true; }
}
btnNotifiche.addEventListener('click', async () => {
  try { await Notification.requestPermission(); } catch (e) { /* browser vecchio */ }
  aggiornaBottoneNotifiche();
});
aggiornaBottoneNotifiche();

btnSimula.addEventListener('click', () => {
  const prossimo = [...promemoria].sort((a, b) => quandoAvvisare(a) - quandoAvvisare(b))[0];
  if (!prossimo) return;
  btnSimula.disabled = true;
  let s = 3;
  btnSimula.textContent = `⏱ Arriva tra ${s}…`;
  const timer = setInterval(() => {
    s--;
    if (s > 0) { btnSimula.textContent = `⏱ Arriva tra ${s}…`; return; }
    clearInterval(timer);
    const titolo = `🔔 Promemoria: ${prossimo.titolo}`;
    const testo = `${NOME_TIPO[prossimo.tipo]} ${dataBreve(prossimo.data)} alle ${prossimo.ora} (${ETICHETTA_ANTICIPO[selAnticipo.value]})`;
    toast('🔔', `Promemoria: ${prossimo.titolo}`, testo);
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(titolo, { body: testo, icon: 'assets/logo-icona.svg' }); } catch (e) { /* alcuni telefoni non lo permettono */ }
    }
    btnSimula.textContent = '⏱ Simula il prossimo promemoria';
    btnSimula.disabled = false;
  }, 1000);
});

// ---------- Prova tu ----------
const risultato = document.getElementById('risultatoProva');
document.getElementById('analizzaProva').addEventListener('click', () => {
  const testo = document.getElementById('testoProva').value.trim();
  risultato.classList.remove('errore');
  if (!testo) { risultato.classList.add('errore'); risultato.textContent = 'Scrivi prima un messaggio 🙂'; return; }
  const a = analizza(testo);
  if (!a.trovata) {
    risultato.classList.add('errore');
    risultato.innerHTML = `Non ho trovato una data. Prova con parole come <em>domani</em>, <em>venerdì</em>, <em>20 novembre</em> o <em>15/12</em>.<br>Priorità: <span class="badge ${a.priorita}">${a.priorita}</span>`;
    return;
  }
  const titolo = maiuscola(testo.replace(/\s+/g, ' ').slice(0, 48)) + (testo.length > 48 ? '…' : '');
  const id = Date.now();
  messaggi.unshift({ id, canale: 'mail', da: 'Tu (prova)', ora: 'Ora', oggetto: 'Messaggio di prova', testo, titolo, analisi: a, segnato: false });
  disegnaMessaggi();
  segnaMessaggio(messaggi[0], true);
  risultato.innerHTML = `✅ Trovato: <b>${NOME_TIPO[a.tipo]}</b> ${dataBreve(a.data)} alle <b>${a.ora || '09:00'}</b>${a.ora ? '' : ' (orario non indicato)'} · priorità <span class="badge ${a.priorita}">${a.priorita}</span><br>L'ho segnato nel calendario e ho creato il promemoria.`;
});

// ---------- avvio ----------
disegnaCalendario();
aggiornaAlert();
disegnaMessaggi();
disegnaPromemoria();

// ---------- 4) Animazione di comparsa allo scroll ----------
const osservatore = new IntersectionObserver((voci) => {
  voci.forEach(v => { if (v.isIntersecting) { v.target.classList.add('visibile'); osservatore.unobserve(v.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; osservatore.observe(el); });
