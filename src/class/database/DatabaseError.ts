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
    public constructor(message?: string, code?: string) {
        if (typeof message === "undefined") {
            super("Unknown database error.");
        } else {
            super(message);
        }
        this.code = code;
    }

    /**
     * エラーコード。
     */
    public readonly code: string | undefined;
}
