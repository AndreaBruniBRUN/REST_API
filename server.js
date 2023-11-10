const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const app = express();
const PORT = 44443;

app.use(bodyParser.json());

// Imposta il percorso assoluto per il file stream-dati.html sul tuo server
//const streamDatiPath = '\\\\ANDBRU-NBT\\D$\\CLIENT-WEB\\index.html'; // Percorso al tuo file HTML (deve essere il percorso dove si trova la pagina compresa la pagina.) funzionante
const streamDatiPath = 'https://client-web-odcm.vercel.app';
//const streamDatiPath = 'https://192.168.43.68:44443/index.html';  //non sa dove è la pagina non funziona.

// Mantenere una lista dei client SSE connessi
let clients = [];

// Variabili per i dati ricevuti dal client C++
let valoreDiX;
let valoreDiY;
let valoreDiZ;

// Endpoint per ricevere i dati dal client C++
app.post('/receive', (req, res) => {
    try {
        const { x, y, z } = req.body;

        // Assegna i valori ricevuti alle variabili
        valoreDiX = parseFloat(x);
        valoreDiY = parseFloat(y);
        valoreDiZ = parseFloat(z);

        // Log per mostrare i dati ricevuti sul terminale del server
        console.log(`Dati ricevuti: x=${valoreDiX}, y=${valoreDiY}, z=${valoreDiZ}`);

        // Invia i dati a tutti i client SSE connessi
        clients.forEach(client => {
            client.res.write(`data: ${JSON.stringify({ x: valoreDiX, y: valoreDiY, z: valoreDiZ })}\n\n`);
        });

        // Invia una risposta di successo al client
        res.status(200).send({ messaggio: 'Dati ricevuti correttamente' });
    } catch (error) {
        // Gestisci gli errori e invia una risposta di errore al client
        console.error('Errore durante l\'elaborazione della richiesta:', error);
        res.status(500).send({ errore: 'Si è verificato un errore durante l\'elaborazione della richiesta' });
    }
});

// Endpoint SSE per il client web
app.get('/index', (req, res) => {
    // Imposta l'header SSE per indicare la trasmissione in streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Consente le richieste da qualsiasi origine

    // Invia il client SSE alla lista dei client connessi
    //clients.push({ id: Date.now(), res });
     // Invia il client SSE alla lista dei client connessi
     const client = { id: Date.now(), res };
     clients.push(client);

    // Rimuovi il client SSE dalla lista quando la connessione viene chiusa
    req.on('close', () => {
        clients = clients.filter(client => client.id !== req.id);
    });
});

// Serve il file stream-dati.html quando viene fatta una richiesta GET all'indirizzo '/'
app.get('/index.html', (req, res) => {
    res.sendFile(streamDatiPath);
});

// Configura le opzioni SSL/TLS_
const options = {
    key: fs.readFileSync('key.pem'),   // Percorso al tuo file chiave privata
    cert: fs.readFileSync('cert.pem')   // Percorso al tuo file certificato pubblico
};
//
// Crea un server HTTPS
const server = https.createServer(options, app);

// Modifica l'indirizzo IP e la porta per far ascoltare il server su un IP diverso   -- 192.168.43.68
const indirizzoIPDelServer = '0.0.0.0'; // Puoi sostituire con l'indirizzo IP del tuo server (ci va l'indirizzo remoto ip esterno) funzionante 0.0.0.0 (li prende tut)
server.listen(PORT, indirizzoIPDelServer, () => {
    console.log(`Server in ascolto all'indirizzo ${indirizzoIPDelServer}:${PORT}`);
});

