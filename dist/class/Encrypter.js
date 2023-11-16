import crypto from "crypto";
/**
 * 文字列を暗号化するクラス。
 */
export default class Encrypter {
    constructor() {
        this.algorithm = "aes-256-gcm";
        this.keyLength = 32;
        this.ivLength = 12;
    }
    /**
     * 指定された文字列を暗号化する。
     *
     * @param target
     * @returns
     */
    encrypt(target, key) {
        if (typeof key !== "undefined") {
            this._key = Buffer.from(key, "hex").subarray(0, this.keyLength).toString("hex");
        }
        else {
            this._key = crypto.randomBytes(this.keyLength).toString("hex");
        }
        this._iv = crypto.randomBytes(this.ivLength).toString("hex");
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this._key, "hex"), Buffer.from(this._iv, "hex"));
        let encrypted = cipher.update(target, "utf-8", "hex");
        encrypted += cipher.final("hex");
        this._authTag = cipher.getAuthTag().toString("hex");
        return encrypted;
    }
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    get key() {
        return this._key;
    }
    set key(key) {
        this._key = key;
    }
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    get iv() {
        return this._iv;
    }
    set iv(iv) {
        this._iv = iv;
    }
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    get authTag() {
        return this._authTag;
    }
    set authTag(authTag) {
        this._authTag = authTag;
    }
    /**
     * 暗号化時に使用したキー、iv、認証タグを使用して、指定された文字列を復号化する。
     *
     * @param target
     * @param key
     * @param iv
     * @param authTag
     * @returns
     */
    decrypt(target, key, iv, authTag) {
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
        decipher.setAuthTag(Buffer.from(authTag, "hex"));
        const decrypted = decipher.update(target, "hex", "utf-8");
        return decrypted + decipher.final("utf-8");
    }
}
