/**
 * 文字列を暗号化するクラス。
 */
declare class Encrypter {
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
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    key: string | undefined;
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    iv: string | undefined;
    /**
     * encryptメソッドの実行時に自動生成される。
     */
    authTag: string | undefined;
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
export default Encrypter;
