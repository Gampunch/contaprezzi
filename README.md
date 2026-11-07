# Contapezzi Evento

Web app gratuita per contare i prodotti dati via durante un evento con un lettore di codici a barre USB.

- Ogni scansione chiede la tipologia: **Pagato**, **Scontato** o **Omaggio**.
- Conta i pezzi e l'incasso per prodotto.
- Stampa le etichette con i codici a barre (Code 128).
- Funziona **anche offline**, dopo la prima apertura online.
- Fa il **backup su Google Sheet**: le scansioni fatte offline restano in coda e vengono inviate appena torna internet.

Costi: zero. Servono GitHub Pages (hosting gratuito) e un Google Sheet con Apps Script (gratuito).

---

## 1. Pubblicare l'app su GitHub Pages

1. Crea una repo **pubblica** su GitHub e carica tutti i file di questa cartella.
2. Vai in **Settings → Pages** e in *Build and deployment* scegli **Deploy from a branch**, poi `main` e `/ (root)`, e premi **Save**.
3. Dopo 1–2 minuti l'app è online su `https://TUONOME.github.io/NOME-REPO/`.

La repo non contiene dati né password. Le scansioni restano nel browser di ogni PC e nel tuo Google Sheet.

## 2. Collegare il Google Sheet (database di backup)

1. Con un account Google **personale** crea un nuovo Google Sheet, ad esempio "Contapezzi – Database". Un account aziendale potrebbe bloccare l'accesso "Chiunque".
2. Nel foglio apri **Estensioni → Apps Script**.
3. Cancella il contenuto, incolla tutto il file [`google-apps-script/Code.gs`](google-apps-script/Code.gs) e salva.
4. Nella riga `const CHIAVE = 'CAMBIA-QUESTA-CHIAVE';` sostituisci la chiave con una parola segreta lunga, ad esempio `evento-ottobre-7f3k9q`.
5. In alto scegli la funzione **setup** e premi **▶ Esegui**. Concedi le autorizzazioni: se compare "Google non ha verificato l'app", vai su *Avanzate → Vai a … (non sicuro)*, perché lo script è il tuo.
6. Vai su **Distribuisci → Nuova distribuzione**, scegli il tipo **App web** e imposta:
   - Esegui come: **Me**
   - Chi ha accesso: **Chiunque**
7. Copia l'**URL dell'app web**, quello che finisce con `/exec`.
8. Nell'app apri la scheda **Google Sheet** e incolla URL e chiave. Dai un nome alla cassa (es. "Cassa 1") e premi **Salva e prova la connessione**.

Nel foglio trovi:

| Foglio | Contenuto |
|---|---|
| Scansioni | una riga per pezzo: ID, data e ora, cassa, codice, prodotto, tipologia, prezzo applicato, origine, stato (`OK` o `ANNULLATA`) |
| Prodotti | l'elenco prodotti aggiornato dall'app |
| Riepilogo | pezzi per tipologia, totali per prodotto e totali per cassa, che si aggiornano da soli |

Se modifichi lo script, devi pubblicare una nuova versione: **Distribuisci → Gestisci distribuzioni → ✏️ → Versione: Nuova versione**. L'URL resta lo stesso.

## 3. Usarlo all'evento

1. Prima dell'evento, **con internet**, apri l'app sul PC della cassa. Da questo momento è salvata per l'uso offline. In Chrome puoi anche installarla come app con l'icona ⊕ nella barra degli indirizzi.
2. Nella scheda **Prodotti** inserisci nomi e prezzi; con prezzo 0 l'incasso non viene calcolato.
3. Nella scheda **Etichette** stampa i codici. I tre codici "Tipo" servono a scegliere Pagato, Scontato o Omaggio direttamente con lo scanner.
4. Durante l'evento: scansiona il prodotto, scegli la tipologia e il pezzo viene salvato.
5. In alto a destra vedi lo stato del backup:
   - *Sheet: sincronizzato*: tutto è già sul Google Sheet.
   - *Offline · N in coda*: le scansioni sono salvate sul PC e partiranno al ritorno della rete.
   - *Sheet: errore*: controlla URL e chiave nella scheda Google Sheet.

**Più casse**: usa lo stesso URL e la stessa chiave su ogni PC, ma con un nome cassa diverso. Il foglio Riepilogo somma tutte le casse.

**Cambio PC o browser svuotato**: inserisci URL, chiave e lo stesso nome cassa, poi premi **Ripristina da Google Sheet**.

**Fine evento**: in *Storico ed export* scarica il CSV. "Azzera conteggio" svuota solo il PC (il Google Sheet resta) ed è bloccato finché ci sono scansioni non ancora inviate.

## Test con il telefono (senza lettore)

1. Apri il link di GitHub Pages dal telefono: serve `https`, altrimenti il browser blocca la fotocamera.
2. Nella scheda **Conteggio** premi **Usa la fotocamera** e consenti l'accesso.
3. Inquadra un'etichetta stampata, o il codice mostrato sullo schermo del PC nella scheda *Etichette*, tenendo il codice orizzontale sulla linea rossa.
4. Scegli la tipologia toccando il pulsante, oppure inquadrando uno dei codici "Tipo".

Funziona su Chrome per Android e su Safari per iPhone. Ogni telefono è una cassa a sé: dagli un nome diverso nella scheda Google Sheet, ad esempio "Test telefono".

## Lettore barcode

Va bene qualsiasi lettore USB che si comporta come una tastiera e invia **Invio** dopo ogni lettura, che è l'impostazione predefinita quasi ovunque. I codici usano solo lettere maiuscole e numeri, così vengono letti correttamente anche con la tastiera italiana.

## Aggiornare l'app

Carica il nuovo `index.html` nella repo e in `sw.js` aumenta il numero di `VERSIONE` (es. `contapezzi-v3`). I dati già salvati non si perdono.

## Licenze

La lettura dei codici con la fotocamera usa [ZXing for JS](https://github.com/zxing-js/library) (Apache 2.0) oppure, dove disponibile, il lettore integrato del browser, caricata da jsDelivr e salvata per l'uso offline.
