const crypto = require('crypto');

const algorithm = 'aes-192-cbc';
const key = crypto.scryptSync(process.env.CRYPT_PASS, "salt", 24);

function encrypt(decrypted) {
  return new Promise(function(resolve, reject) {
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = '';
    cipher.on('readable', () => {
      let chunk;
      while (null !== (chunk = cipher.read())) {
        encrypted += chunk.toString('hex');
      }
    });
    cipher.on('end', () => {
      resolve(encrypted);
    });

    cipher.write(decrypted);
    cipher.end();
  });
}

function decrypt(encrypted) {
  return new Promise(function(resolve, reject) {
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = '';
    decipher.on('readable', () => {
      let chunk;
      while (null !== (chunk = decipher.read())) {
        decrypted += chunk.toString('utf8');
      }
    });
    decipher.on('end', () => {
      resolve(decrypted);
    });
    
    decipher.write(encrypted, 'hex');
    decipher.end();
  });
}

module.exports = { encrypt, decrypt };