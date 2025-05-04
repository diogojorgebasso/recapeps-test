const config = process.env.FIREBASE_WEBAPP_CONFIG;
const configFirebase = config ? JSON.parse(config) : null;

export const clientConfig = {
    apiKey: configFirebase.apiKey!,
    authDomain: configFirebase.authDomain!,
    databaseURL: configFirebase.databaseURL!,
    projectId: configFirebase.projectId!,
    messagingSenderId: configFirebase.messagingSenderId!,
    appId: configFirebase.appId!
};