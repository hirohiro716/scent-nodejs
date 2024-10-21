/**
 * データベースレコードがコンフリクトした場合に発生するエラーのクラス。
 */
export default class RecordConflictError extends Error {
    /**
     * @deprecated
     */
    constructor(parameter1, conflictRecords) {
        if (typeof parameter1 === "string") {
            super(parameter1);
            this.conflictRecords = conflictRecords;
        }
        else {
            super("データベースレコードが競合しました。");
            this.conflictRecords = parameter1;
        }
    }
}
