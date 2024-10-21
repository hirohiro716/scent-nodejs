import { RecordMap } from "scent-typescript";
/**
 * データベースレコードがコンフリクトした場合に発生するエラーのクラス。
 */
export default class RecordConflictError extends Error {
    /**
     * コンストラクタ。コンフリクトの原因になったレコードを指定する。
     */
    constructor(conflictRecords: RecordMap[]);
    /**
     * コンストラクタ。エラーメッセージとコンフリクトの原因になったレコードを指定する。
     */
    constructor(message: string, conflictRecords: RecordMap[]);
    /**
     * 原因となったレコード。
     */
    readonly conflictRecords: RecordMap[];
}
