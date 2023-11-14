import crypto from "crypto";

/**
 * 文字列を暗号化するクラス。
 */
export default class Encrypter {

    private readonly algorithm = "aes-256-gcm";

    private readonly keyLength = 32;

    private readonly ivLength = 12;

    /**
     * 指定された文字列を暗号化する。
     * 
     * @param target 
     * @returns 
     */
    public encrypt(target: string, key?: string): string {
        if (typeof key !== "undefined") {
            this._key = Buffer.from(key, "hex").subarray(0, this.keyLength).toString("hex");
        } else {
            this._key = crypto.randomBytes(this.keyLength).toString("hex");
        }
        this._iv = crypto.randomBytes(this.ivLength).toString("hex");
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this._key, "hex"), Buffer.from(this._iv, "hex"));
        let encrypted = cipher.update(target, "utf-8", "hex");
         encrypted += cipher.final("hex");
        this._authTag = cipher.getAuthTag().toString("hex");
        return encrypted;
    }

    private _key: string | undefined;

    /**
     * encryptメソッドの実行時に自動生成される。
     */
    public get key(): string | undefined {
        return this._key;
    }

    public set key(key: string | undefined) {
        this._key = key;
    }

    private _iv: string | undefined;

    /**
     * encryptメソッドの実行時に自動生成される。
     */
    public get iv(): string | undefined {
        return this._iv;
    }

    public set iv(iv: string | undefined) {
        this._iv = iv;
    }

    private _authTag: string | undefined;

    /**
     * encryptメソッドの実行時に自動生成される。
     */
    public get authTag(): string | undefined {
        return this._authTag;
    }

    public set authTag(authTag: string | undefined) {
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
    public decrypt(target: string, key: string, iv: string, authTag: string): string {
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(key, "hex"), Buffer.from(iv, "hex"));
        decipher.setAuthTag(Buffer.from(authTag, "hex"));
        const decrypted = decipher.update(target, "hex", "utf-8");
        return decrypted + decipher.final("utf-8");
    }
}
