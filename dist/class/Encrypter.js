import crypto from "crypto";
/**
 * 文字列を暗号化するクラス。
 */
class Encrypter {
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
            this.key = Buffer.from(key, "hex").subarray(0, this.keyLength).toString("hex");
        }
        else {
            this.key = crypto.randomBytes(this.keyLength).toString("hex");
        }
        this.iv = crypto.randomBytes(this.ivLength).toString("hex");
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key, "hex"), Buffer.from(this.iv, "hex"));
        let encrypted = cipher.update(target, "utf-8", "hex");
        encrypted += cipher.final("hex");
        this.authTag = cipher.getAuthTag().toString("hex");
        return encrypted;
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
export default Encrypter;
