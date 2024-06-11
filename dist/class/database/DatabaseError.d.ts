/**
 * データベースへの処理に失敗した場合に発生するエラーのクラス。
 */
export default class DatabaseError extends Error {
    /**
     * コンストラクタ。エラーメッセージとエラーコードを指定する。
     *
     * @param messages
     * @param code
     */
    constructor(message?: string, code?: string);
    /**
     * エラーコード。
     */
    readonly code: string | undefined;
}
