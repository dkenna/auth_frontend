import Dexie from 'dexie'

export const db = new Dexie('keystore')
db.version(1).stores({
    keystore: '++id,username,priv_key,pub_key,date'
})

export function spkiToPEM (keydata) {
    var keydataS = arrayBufferToString(keydata)
    var keydataB64 = window.btoa(keydataS)
    var keydataB64Pem = formatAsPem(keydataB64)
    return keydataB64Pem
}

function arrayBufferToString (buffer) {
    var binary = ''
    var bytes = new Uint8Array(buffer)
    var len = bytes.byteLength
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return binary
}

function formatAsPem (str) {
    var finalString = '-----BEGIN PUBLIC KEY-----\n'
    while (str.length > 0) {
        finalString += str.substring(0, 64) + '\n'
        str = str.substring(64)
    }
    finalString = finalString + '-----END PUBLIC KEY-----'
    return finalString
}

// export default db
