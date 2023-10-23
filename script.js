import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { getStorage, ref as refStorage, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyDnd7Rk7hOP5beES9nRJDvuJh_K7I8mDTU",
    authDomain: "vid-lingo.firebaseapp.com",
    databaseURL: "https://vid-lingo-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "vid-lingo",
    storageBucket: "vid-lingo.appspot.com",
    messagingSenderId: "571992659063",
    appId: "1:571992659063:web:864dc2fd1d7ea98fd2e272",
    measurementId: "G-D8RCY8X6NF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

function generateRandomString() {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < 20; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

let id = generateRandomString();
document.getElementById('form-btn').addEventListener('click', function() {
    // Recupera i dati del form
    let nome = document.getElementById('nome');
    let email = document.getElementById('email');
    let eta = document.getElementById('età');
    let sesso = document.getElementById('sesso');
    let nazione = document.getElementById('nazione');
    let lettera = document.getElementById('lettera');

    let linguaMadre = document.getElementById('lingua_madre');
    let linguaMadreNoAcc = document.getElementById('lingua_madre_no_accenti');
    let altreLingue = document.getElementById('altre_lingue');
    let esperienzaTrad = document.getElementById('esperienza_trad');
    let certificazione = document.getElementById('certificazioni')

    let possiedeMicr = Array.from(document.getElementsByName('possiede_microfono')).find(radio => radio.checked);
    let esperienzaDop = document.getElementById('esperienza_dop');
    let AudioFile = document.getElementById('audio');

    let accPP = document.getElementById('acc-pp');

    let verPers = (/^\b\w{1,15}\b \b\w{1,15}\b(?: \b\w{1,15}\b)?(?: \b\w{1,15}\b)?$/.test(nome.value) && /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.value) && Number(eta.value) > 5 && Number(eta.value) < 80 && nazione.value.length > 3)
    let verTrad = (linguaMadre.value.length > 4 && linguaMadreNoAcc.checked && altreLingue.value.length > 4)
    let verDop = possiedeMicr != null && AudioFile.files.length === 1
    let ver = true

    if (!verPers) {
        document.getElementById("err-pers").classList.add("d-flex")
        ver = false
    } else
        document.getElementById("err-pers").classList.remove("d-flex")

    if (!verTrad) {
        document.getElementById("err-trad").classList.add("d-flex")
        ver = false
    } else
        document.getElementById("err-trad").classList.remove("d-flex")

    if (!verDop) {
        document.getElementById("err-dop").classList.add("d-flex")
        ver = false
    } else
        document.getElementById("err-dop").classList.remove("d-flex")

    if (!accPP.checked) {
        document.getElementById("err-pp").classList.add("d-flex")
        ver = false
    } else
        document.getElementById("err-pp").classList.remove("d-flex")

    if (!ver) {
        logEvent(analytics, "form_incompleto", {
            stato: "errori campi ",
            campiErr: (verPers ? "0" : "1") + " " + (verTrad ? "0" : "1") + " " + (verDop ? "0" : "1")
        })
        return
    }

    let risultato = {
        nome: nome.value,
        email: email.value,
        "età": eta.value,
        sesso: sesso.value,
        nazione: nazione.value,
        lettera: lettera.value,
        "lingua madre": linguaMadre.value,
        "altre lingue": altreLingue.value,
        "esperienza traduzione": esperienzaTrad.value,
        "possiede microfono": possiedeMicr.value,
        "esperienza doppiaggio": esperienzaDop.value,
        data: serverTimestamp()
    }

    document.getElementById('form-div').classList.add("d-none");
    document.getElementById('form-attesa').classList.remove("d-none");

    function errore(_err) {
        document.getElementById('form-attesa').classList.add("d-none");
        document.getElementById('form-err').classList.remove("d-none");
        document.getAnimations("err-code").innerHTML = _err.code
        logEvent(analytics, "form_errore", {
            errore: _err.code
        })
        console.log(_err.code)
    }

    uploadBytes(refStorage(getStorage(app), 'candidature/' + id + "/file audio"), AudioFile.files[0]).then(snap => {
        getDownloadURL(refStorage(getStorage(app), 'candidature/' + id + "/file audio")).then(urlA => {
            risultato.audioURL = urlA
            if (certificazione.files.length > 0) {
                uploadBytes(refStorage(getStorage(app), 'candidature/' + id + "/certificazioni"), certificazione.files[0]).then(snap => {
                    getDownloadURL(refStorage(getStorage(app), 'candidature/' + id + "/certificazioni")).then(urlC => {
                        risultato.certificazioniURL = urlC;
                        set(ref(getDatabase(app), "candidature/" + id), risultato).then(snapshot => {
                            document.getElementById('form-attesa').classList.add("d-none");
                            document.getElementById('form-comp').classList.remove("d-none");
                            logEvent(analytics, "form_inviato", {
                                "certificazione allegata": true,
                                lingua: risultato.linguaMadre,
                                "altre lingue": risultato.altreLingue,
                                "nazionalità": risultato.nazione,
                                "età": risultato.età
                            })
                        }).catch(err => errore(err))
                    }).catch(err => errore(err))
                }).catch(err => errore(err))
            } else
                set(ref(getDatabase(app), "candidature/" + id), risultato).then(snapshot => {
                    document.getElementById('form-attesa').classList.add("d-none");
                    document.getElementById('form-comp').classList.remove("d-none");
                    logEvent(analytics, "form_inviato", {
                        "certificazione allegata": false,
                        lingua: risultato.linguaMadre,
                        "altre lingue": risultato.altreLingue,
                        "nazionalità": risultato.nazione,
                        "età": risultato.età
                    })
                }).catch(err => errore(err))
        }).catch(err => errore(err))
    }).catch(err => errore(err))
})

document.getElementById("cta1").addEventListener("click", () => logEvent(analytics, "premuta_call_to_action", {
    "pulsante id": "cta1"
}))
document.getElementById("cta2").addEventListener("click", () => logEvent(analytics, "premuta_call_to_action", {
    "pulsante id": "cta2"
}))
document.getElementById("cta3").addEventListener("click", () => logEvent(analytics, "premuta_call_to_action", {
    "pulsante id": "cta3"
}))
document.getElementById("contattaci_btn").addEventListener("click", () => logEvent(analytics, "richiesto_supporto", {}))