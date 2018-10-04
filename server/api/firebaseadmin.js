let admin = require("firebase-admin");

let serviceAccount;
if (process.env.type){
  serviceAccount = {
    type: process.env.type,
    projectId: process.env.project_id,
    privateKeyId: process.env.private_key_id,
    privateKey: process.env.private_key.replace(/\\n/g, '\n'),
    clientEmail: process.env.client_email,
    clientId: process.env.client_id,
    authUri: process.env.auth_uri,
    tokenUri: process.env.token_uri,
    authProviderX509CertUrl: process.env.auth_provider_x509_cert_url,
    clientX509CertUrl: process.env.client_x509_cert_url
  };
} else {
  serviceAccount = require("./firebase-admin.json")
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://herd-217719.firebaseio.com"
});

let db = admin.database();

module.exports = {admin, db};
