import Dexie from 'dexie'

const db = new Dexie('keystore')
db.version(1).stores({
    keystore: '++id,username,priv_key,pub_key,date'
})

export default db
