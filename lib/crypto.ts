import forge from 'node-forge';

const SECRET = process.env.ENCRYPTION_SECRET!;

function getKeyAndIv(): { key: string; iv: string } {
    // 32 char secret -> 32 byte key (AES-256), 16 byte IV sabit
    const key = SECRET.slice(0, 32).padEnd(32, '0');
    const iv = SECRET.slice(0, 16).padEnd(16, '0');
    return { key, iv };
}

export function encryptApiKey(plaintext: string): string {
    const { key, iv } = getKeyAndIv();
    const cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({ iv });
    cipher.update(forge.util.createBuffer(plaintext, 'utf8'));
    cipher.finish();
    return forge.util.encode64(cipher.output.getBytes());
}

export function decryptApiKey(encrypted: string): string {
    const { key, iv } = getKeyAndIv();
    const decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({ iv });
    decipher.update(forge.util.createBuffer(forge.util.decode64(encrypted)));
    decipher.finish();
    return decipher.output.toString();
}
