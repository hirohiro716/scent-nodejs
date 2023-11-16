/**
 * 文字列を暗号化するクラス。
 */
export default class Encrypter {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    /**
     * 指定された文字列を暗号化する。
     *
     * @param target
     * @returns
     */
    encrypt(target: string, key?: string): string;
    private _key;
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    get key(): string | undefined;
    set key(key: string | undefined);
    private _iv;
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    get iv(): string | undefined;
    set iv(iv: string | undefined);
    private _authTag;
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    get authTag(): string | undefined;
    set authTag(authTag: string | undefined);
    /**
     * 暗号化時に使用したキー、iv、認証タグを使用して、指定された文字列を復号化する。
     *
     * @param target
     * @param key
     * @param iv
     * @param authTag
     * @returns
     */
    decrypt(target: string, key: string, iv: string, authTag: string): string;
}
