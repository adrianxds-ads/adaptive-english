/* Durable overflow store for Grammar Quest; existing localStorage is never removed. */
(()=>{'use strict';
  const DB_NAME='adrian-grammar-progress-v1', STORE='campaigns';
  let connection=null, writes=Promise.resolve();
  function open(){
    if(!('indexedDB' in window))return Promise.reject(Error('IndexedDB unavailable'));
    if(connection)return connection;
    connection=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||Error('IndexedDB open failed'));
      request.onblocked=()=>reject(Error('IndexedDB upgrade blocked'));
    }).catch(e=>{connection=null;throw e;});
    return connection;
  }
  async function get(key){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const request=tx.objectStore(STORE).get(key);
      request.onsuccess=()=>{
        const record=request.result;
        if(!record){resolve(null);return;}
        try{
          if(record.format!=='gzip-v1'||!record.bytes)throw Error('Invalid progress format');
          resolve(pako.ungzip(new Uint8Array(record.bytes),{to:'string'}));
        }catch(e){reject(e);}
      };
      request.onerror=()=>reject(request.error||Error('IndexedDB read failed'));
    });
  }
  async function write(key,payload){
    const bytes=pako.gzip(payload),db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put({format:'gzip-v1',bytes,updatedAt:Date.now()},key);
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>reject(tx.error||Error('IndexedDB write failed'));
      tx.onabort=()=>reject(tx.error||Error('IndexedDB write aborted'));
    });
  }
  function put(key,payload){
    const next=writes.catch(()=>{}).then(()=>write(key,payload));
    writes=next;
    return next;
  }
  window.GrammarProgressDB=Object.freeze({get,put});
})();
