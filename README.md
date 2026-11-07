# Contapezzi Evento

Web app gratuita per contare i prodotti dati via durante un evento. Funziona su telefono, tablet e PC, con lettore di codici a barre USB, con la fotocamera o toccando i prodotti.

- Ogni vendita chiede la tipologia: **Pagato**, **Scontato** o **Omaggio**.
- Funziona **anche offline**: le vendite restano sul dispositivo e partono appena torna internet.
- Il **Google Sheet** è il database: riceve tutte le vendite e contiene l'elenco prodotti condiviso tra le postazioni.
- Ogni dispositivo si attiva con **una sola password**.

## Per chi sta alla cassa

1. Apri il link dell'app. Al primo avvio inserisci la password dell'evento, che te la dà il responsabile.
2. Per vendere hai tre modi:
   - **tocchi il prodotto** sullo schermo;
   - **scansioni l'etichetta** con il lettore USB;
   - premi **Fotocamera** e inquadri l'etichetta.
3. Scegli **Pagato**, **Scontato** o **Omaggio**. Fatto.
4. Se hai sbagliato, premi **Annulla ultimo** due volte.
5. In alto vedi lo stato del salvataggio:
   - *Tutto salvato*: tutte le vendite sono nel Google Sheet.
   - *N da inviare*: le vendite partiranno da sole.
   - *Offline*: vendi tranquillo, le vendite restano sul dispositivo.

Sul telefono puoi aggiungere l'app alla schermata Home: su iPhone con Condividi → Aggiungi alla schermata Home, su Android con il menu ⋮ → Installa app.

## Per il responsabile: area Gestione

Il pulsante **Gestione** in alto a destra è protetto dalla stessa password. Contiene:

- **Riepilogo**: totali della postazione, correzioni, export CSV, azzeramento.
- **Prodotti**: nomi, prezzi e codici. Le modifiche arrivano a tutte le postazioni entro un minuto.
- **Etichette**: stampa dei codici a barre.
- **Impostazioni**: nome della postazione, percentuale di sconto, suono, stato del collegamento, ripristino, disattivazione del dispositivo.

Il totale di **tutte le postazioni** è nel Google Sheet, foglio **Riepilogo**.

## Configurazione (una volta sola)

### Google Sheet
1. In un Google Sheet apri **Estensioni → Apps Script** e incolla [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
2. Nella riga `const CHIAVE = '...'` scrivi la **password dell'evento**.
3. Esegui la funzione **setup** e concedi le autorizzazioni.
4. Vai su **Distribuisci → Nuova distribuzione → App web**, con *Esegui come: Me* e *Chi ha accesso: Chiunque*. Copia l'URL che finisce con `/exec`.

### App
In `index.html` la riga `var DEFAULT_URL="…/exec";` contiene l'indirizzo dello script. Per un nuovo evento con un nuovo Sheet basta cambiare quella riga.

### Cambiare la password
Modifica `CHIAVE` nello script, poi vai su **Distribuisci → Gestisci distribuzioni → ✏️ → Nuova versione**. I dispositivi già attivi andranno riattivati con la nuova password: Gestione → Impostazioni → Disattiva, poi rientra.

## Pubblicazione

L'app è ospitata su GitHub Pages (repo pubblica, Settings → Pages → branch `main`, cartella root). La repo non contiene né vendite né password: l'indirizzo dello script senza la password non permette di scrivere nello Sheet.

**Per aggiornare**: carica il nuovo `index.html` e in `sw.js` aumenta `VERSIONE` (es. `contapezzi-v5`). Sui dispositivi basta ricaricare l'app due volte.

## Lettore barcode USB

Va bene qualsiasi lettore che si comporta come una tastiera e invia **Invio** dopo ogni lettura (impostazione di fabbrica quasi ovunque). Sullo schermo non serve cliccare nulla: basta scansionare. Con i codici "Tipo" stampati dalla Gestione si sceglie la tipologia senza toccare lo schermo.

## Licenze

La lettura dalla fotocamera usa il lettore integrato del browser dove disponibile, altrimenti [ZXing for JS](https://github.com/zxing-js/library) (Apache 2.0), caricato da jsDelivr e salvato per l'uso offline.
