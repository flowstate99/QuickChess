importScripts('stockfish.js');

var engine = new Worker('stockfish.js');


engine.onmessage = function(event) {
    // Handle messages from the Stockfish engine
    // Example: If the Stockfish engine outputs best move, send it to the main thread
    self.postMessage(event.data);
};

self.onmessage = function(event) {
    // Receive commands from the main thread and send them to the Stockfish engine
    engine.postMessage(event.data);
};