/* =========================================================
   UniFlow – Ricerca nelle cartelle
   Scrivi una parola chiave: mostra tutte le cartelle (clienti,
   fornitori, team) che contengono email, chat, file o riunioni
   con quella parola. Le parole con # cercano tra i tag.
   ========================================================= */
(() => {
  const CARTELLE = [
    { nome: 'Studio Rossi', desc: 'Cliente · Progetto nuova sede', ico: '🏢', colore: '#dbeafe', elementi: [
      { tipo: 'email', titolo: 'Re: Progetto nuova sede', testo: 'Approviamo il preventivo da 12.400 €, consegna entro il 20 novembre.', data: '10 nov', tags: ['preventivo', 'approvato'] },
      { tipo: 'file', titolo: 'Contratto_Rossi.pdf', testo: 'Contratto da firmare per i lavori della nuova sede.', data: '11 nov', tags: ['contratto', 'urgente'] },
      { tipo: 'file', titolo: 'Preventivo_nuova_sede.pdf', testo: 'Preventivo inviato e visualizzato dal cliente.', data: '18 ott', tags: ['preventivo'] },
      { tipo: 'riunione', titolo: 'Riunione kickoff', testo: 'Verbale: definite le fasi del progetto con Andrea Rossi.', data: '25 ott', tags: ['riunione', 'verbale'] },
      { tipo: 'whatsapp', titolo: 'Foto del cantiere', testo: 'Andrea Rossi ha inviato 12 immagini dal cantiere.', data: '3 nov', tags: ['cantiere'] },
    ]},
    { nome: 'Cliente Ferri', desc: 'Cliente · Ordini e forniture', ico: '🛒', colore: '#dcfce7', elementi: [
      { tipo: 'email', titolo: "URGENTE: errore nell'ordine #3381", testo: "Il cliente segnala un errore nell'ordine e chiede una call.", data: '12 nov', tags: ['urgente', 'ordine'] },
      { tipo: 'file', titolo: 'Ordine_3381.xlsx', testo: "Dettaglio di articoli e quantità dell'ordine.", data: '5 nov', tags: ['ordine'] },
      { tipo: 'chiamata', titolo: 'Call con Cliente Ferri', testo: "Chiamata per risolvere l'errore nell'ordine.", data: '13 nov', tags: ['chiamata'] },
      { tipo: 'email', titolo: 'Preventivo fornitura 2027', testo: 'Richiesta di preventivo per la fornitura del prossimo anno.', data: '28 ott', tags: ['preventivo'] },
    ]},
    { nome: 'Fornitore Verdi', desc: 'Fornitore · Materiali', ico: '🚚', colore: '#fef3c7', elementi: [
      { tipo: 'email', titolo: 'Fattura n. 245 – Ottobre', testo: 'In allegato la fattura per i materiali di ottobre.', data: '2 nov', tags: ['fattura', 'pagamento'] },
      { tipo: 'file', titolo: 'Fattura_245.pdf', testo: 'Importo 3.250 €, pagamento entro fine mese.', data: '2 nov', tags: ['fattura'] },
      { tipo: 'whatsapp', titolo: 'Consegna materiali', testo: 'La consegna dei materiali arriva giovedì mattina.', data: '9 nov', tags: ['consegna'] },
    ]},
    { nome: 'Amministrazione', desc: 'Interno · Contabilità', ico: '📁', colore: '#ede9fe', elementi: [
      { tipo: 'email', titolo: 'Sollecito fattura n. 245', testo: 'Ricordiamo che la fattura del fornitore Verdi va pagata.', data: 'Ieri', tags: ['fattura', 'urgente'] },
      { tipo: 'file', titolo: 'Bilancio_Q3.xlsx', testo: 'Bilancio del terzo trimestre con 3 nuove modifiche.', data: '30 ott', tags: ['bilancio'] },
      { tipo: 'file', titolo: 'Contratti_fornitori_2026.pdf', testo: 'Raccolta di tutti i contratti con i fornitori.', data: '15 set', tags: ['contratto'] },
    ]},
    { nome: 'Team interno', desc: 'Interno · Marketing e personale', ico: '👥', colore: '#cffafe', elementi: [
      { tipo: 'whatsapp', titolo: 'Giulia: nuove grafiche', testo: 'Ho caricato le nuove grafiche nella cartella condivisa.', data: '12 nov', tags: ['grafiche'] },
      { tipo: 'file', titolo: 'Logo_UniFlow.png', testo: 'Versione definitiva del logo per sfondo chiaro.', data: '10 nov', tags: ['grafiche', 'logo'] },
      { tipo: 'riunione', titolo: 'Riunione mensile del team', testo: 'Aggiornamento sui progetti e sulle scadenze del mese.', data: '2 dic', tags: ['riunione'] },
      { tipo: 'email', titolo: 'Contratto collaboratrice', testo: 'Rinnovo del contratto di Giulia per il 2027.', data: '6 nov', tags: ['contratto'] },
    ]},
  ];
  const ICONA = { email: '✉️', whatsapp: '💬', file: '📄', riunione: '📅', chiamata: '📞' };
  const SINONIMI = { email: 'email mail', whatsapp: 'whatsapp messaggio chat', file: 'file documento allegato', riunione: 'riunione incontro', chiamata: 'chiamata call telefonata' };

  const input = document.getElementById('cerca');
  const box = document.getElementById('risultatiRicerca');
  const info = document.getElementById('infoRicerca');
  if (!input || !box) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ACC = { a: '[aàá]', e: '[eèé]', i: '[iìí]', o: '[oòó]', u: '[uùú]' };
  const pattern = (p) => p.split('').map(c => ACC[c] || c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');

  function evidenzia(testo, regex) {
    if (!regex) return esc(testo);
    let out = '', ultimo = 0;
    for (const m of testo.matchAll(regex)) {
      if (!m[0]) continue;
      out += esc(testo.slice(ultimo, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
      ultimo = m.index + m[0].length;
    }
    return out + esc(testo.slice(ultimo));
  }

  function cerca(query) {
    const t0 = performance.now();
    const parole = norm(query.trim()).split(/\s+/).filter(Boolean);
    const testo = parole.filter(p => !p.startsWith('#'));
    const tag = parole.filter(p => p.startsWith('#')).map(p => p.slice(1)).filter(Boolean);
    const tutte = [...testo, ...tag];
    const regex = tutte.length ? new RegExp(tutte.map(pattern).join('|'), 'gi') : null;

    const trovate = [];
    let totale = 0;
    for (const c of CARTELLE) {
      const elementi = c.elementi.filter(el => {
        if (!parole.length) return true;
        const dove = norm([c.nome, c.desc, el.titolo, el.testo, el.tags.join(' '), SINONIMI[el.tipo]].join(' '));
        return testo.every(p => dove.includes(p)) && tag.every(tg => el.tags.some(x => x.startsWith(tg)));
      });
      if (elementi.length) { trovate.push({ c, elementi }); totale += elementi.length; }
    }
    const ms = performance.now() - t0;
    const secondi = ms < 10 ? 'meno di 0,01' : (ms / 1000).toFixed(2).replace('.', ',');

    if (!parole.length) {
      info.innerHTML = `📂 <b>${CARTELLE.length} cartelle</b> · ${totale} elementi in totale. Scrivi una parola per cercare.`;
    } else if (!totale) {
      info.textContent = '';
      box.innerHTML = `<div class="nessun-risultato">😕 Nessun risultato per “<b>${esc(query.trim())}</b>”.<br>Prova con un'altra parola, ad esempio <em>contratto</em> o <em>fattura</em>.</div>`;
      return;
    } else {
      info.innerHTML = `<b>${totale} ${totale === 1 ? 'risultato' : 'risultati'}</b> in <b>${trovate.length} ${trovate.length === 1 ? 'cartella' : 'cartelle'}</b> · ${secondi} s`;
    }

    box.innerHTML = trovate.map(({ c, elementi }) => {
      const mostrati = parole.length ? elementi : elementi.slice(0, 3);
      const altri = elementi.length - mostrati.length;
      const conta = parole.length ? `${elementi.length} ${elementi.length === 1 ? 'risultato' : 'risultati'}` : `${c.elementi.length} elementi`;
      return `<article class="cartella">
        <div class="cartella-head">
          <span class="cartella-ico" style="background:${c.colore}">${c.ico}</span>
          <div><h3>${evidenzia(c.nome, regex)}</h3><p>${esc(c.desc)}</p></div>
          <span class="conta">${conta}</span>
        </div>
        <ul class="elementi">
          ${mostrati.map(el => `<li class="elemento">
            <span class="el-ico" title="${el.tipo}">${ICONA[el.tipo]}</span>
            <div>
              <div class="el-top"><strong>${evidenzia(el.titolo, regex)}</strong><time>${el.data}</time></div>
              <p>${evidenzia(el.testo, regex)}</p>
              <div class="tags">${el.tags.map(tg => `<button class="tag ${tutte.some(p => tg.startsWith(p)) ? 'match' : ''}" data-q="#${tg}">#${tg}</button>`).join('')}</div>
            </div>
          </li>`).join('')}
          ${altri > 0 ? `<li class="elemento"><span></span><p>+ altri ${altri} elementi</p></li>` : ''}
        </ul>
      </article>`;
    }).join('');
  }

  const imposta = (q) => { input.value = q; cerca(q); };
  input.addEventListener('input', () => cerca(input.value));
  document.querySelectorAll('.suggerimenti [data-q]').forEach(b => b.addEventListener('click', () => imposta(b.dataset.q)));
  box.addEventListener('click', (e) => { const t = e.target.closest('.tag'); if (t) { imposta(t.dataset.q); input.focus(); } });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault();
      document.getElementById('ricerca').scrollIntoView({ behavior: 'smooth' });
      input.focus({ preventScroll: true });
    }
  });
  cerca('');
})();
