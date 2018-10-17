// Firebase test server

const FirebaseServer = require('firebase-server');

const serverTest = new FirebaseServer(5000, 'localhost', {});

module.exports = serverTest;
