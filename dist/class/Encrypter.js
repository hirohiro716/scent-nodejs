import { default as Crypto } from "crypto";
import { ByteArray } from "scent-typescript";
/**
 * データを暗号化するクラス。
 *
 * @author hiro
 */
export class Encrypter {
    /**
     * @deprecated
     */
    constructor(algorithm, passwordOrKey, salt) {
        this._key = undefined;
        this._authTagLength = 16;
        const cipherInfo = Crypto.getCipherInfo(algorithm);
        if (typeof cipherInfo === "undefined" || typeof cipherInfo.ivLength === "undefined") {
            throw new Error("Could not find the specified algorithm.");
        }
        this._algorithm = algorithm;
        this._cipherInfo = cipherInfo;
        if (typeof passwordOrKey !== "undefined") {
            if (passwordOrKey instanceof ByteArray) {
                this._key = passwordOrKey;
            }
            else if (typeof salt !== "undefined") {
                this._key = new ByteArray(Crypto.scryptSync(passwordOrKey, salt, cipherInfo.keyLength));
            }
        }
    }
    /**
     * このインスタンスの共通鍵。
     */
    get key() {
        return this._key;
    }
    /**
     * このインスタンスで使用される共通鍵の長さ。
     */
    get keyLength() {
        return this._cipherInfo.keyLength;
    }
    /**
     * このインスタンスで使用される初期ベクトルの長さ。
     */
    get ivLength() {
        return this._cipherInfo.ivLength;
    }
    /**
     * このインスタンスで使用される認証タグの長さ。初期値は16バイト。
     */
    get authTagLength() {
        return this._authTagLength;
    }
    set authTagLength(length) {
        this._authTagLength = length;
    }
    /**
     * 指定されたデータを暗号化する。
     *
     * @param data
     * @returns
     */
    encrypt(data) {
        if (typeof this._key === "undefined") {
            this._key = new ByteArray(Crypto.randomBytes(this._cipherInfo.keyLength));
        }
        const iv = Crypto.randomBytes(this._cipherInfo.ivLength);
        const options = { authTagLength: this._authTagLength };
        const cipher = Crypto.createCipheriv(this._algorithm, this._key.uint8Array, iv, options);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        let authTag = undefined;
        const cipherObject = cipher;
        if (typeof cipherObject.getAuthTag === "function") {
            authTag = new ByteArray(cipherObject.getAuthTag());
        }
        return {
            content: new ByteArray(encrypted),
            iv: new ByteArray(iv),
            authTag: authTag,
        };
    }
    /**
     * 暗号化されたデータを復号化する。
     *
     * @param encryptedData
     */
    decrypt(encryptedData) {
        if (typeof this._key === "undefined") {
            this._key = new ByteArray(Crypto.randomBytes(this._cipherInfo.keyLength));
        }
        const options = { authTagLength: this._authTagLength };
        const decipher = Crypto.createDecipheriv(this._algorithm, this._key.uint8Array, encryptedData.iv.uint8Array, options);
        const decipherObject = decipher;
        if (typeof encryptedData.authTag !== "undefined" && typeof decipherObject.setAuthTag === "function") {
            decipherObject.setAuthTag(encryptedData.authTag.uint8Array);
        }
        const decrypted = Buffer.concat([decipher.update(encryptedData.content.uint8Array), decipher.final()]);
        return decrypted;
    }
}
