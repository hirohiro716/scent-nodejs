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
    constructor(message, code) {
        if (typeof message === "undefined") {
            super("Unknown database error.");
        }
        else {
            super(message);
        }
        this.code = code;
    }
}
