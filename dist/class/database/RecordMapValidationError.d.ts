import { Column, ObjectValidationError, RecordMap } from "scent-typescript";
/**
 * データベースレコードが妥当ではない場合に発生するエラーのクラス。
 */
export declare class RecordMapValidationError extends Error {
    /**
     * コンストラクタ。原因となったレコード、カラムとメッセージの連想配列を指定する。
     *
     * @param causeRecord
     * @param causeMessages
     */
    constructor(causeRecord: RecordMap, causeMessages: Map<Column, string> | ObjectValidationError);
    /**
     * 原因となったレコード。
     */
    readonly causeRecord: RecordMap;
    /**
     * 原因となったカラム。
     */
    readonly causeColumns: Column[];
    /**
     * 原因となったカラムとメッセージの連想配列。
     */
    private readonly causeMessages;
    /**
     * 指定されたカラムのエラーメッセージを取得する。
     *
     * @param causeColumn
     * @returns
     */
    getMessage(causeColumn: Column): string;
}
