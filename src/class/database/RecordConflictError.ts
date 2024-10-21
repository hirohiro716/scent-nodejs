import { RecordMap } from "scent-typescript";

/**
 * データベースレコードがコンフリクトした場合に発生するエラーのクラス。
 */
export default class RecordConflictError extends Error {

    /**
     * コンストラクタ。コンフリクトの原因になったレコードを指定する。
     */
    public constructor(conflictRecords: RecordMap[]);

    /**
     * コンストラクタ。エラーメッセージとコンフリクトの原因になったレコードを指定する。
     */
    public constructor(message: string, conflictRecords: RecordMap[]);

    /**
     * @deprecated
     */
    public constructor(parameter1: string | RecordMap[], conflictRecords?: RecordMap[]) {
        if (typeof parameter1 === "string") {
            super(parameter1);
            this.conflictRecords = conflictRecords!;
        } else {
            super("データベースレコードが競合しました。");
            this.conflictRecords = parameter1;
        }
    }

    /**
     * 原因となったレコード。
     */
    public readonly conflictRecords: RecordMap[];
}
