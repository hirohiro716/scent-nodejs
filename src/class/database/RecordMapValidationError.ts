import { Column, ObjectValidationError, RecordMap } from "scent-typescript";

/**
 * データベースレコードが妥当ではない場合に発生するエラーのクラス。
 */
export class RecordMapValidationError extends Error {

    /**
     * コンストラクタ。原因となったレコード、カラムとメッセージの連想配列を指定する。
     * 
     * @param causeRecord 
     * @param causeMessages 
     */
    public constructor(causeRecord: RecordMap, causeMessages: Map<Column, string> | ObjectValidationError) {
        super("データベースレコードの妥当性確認に失敗しました。");
        this.causeRecord = causeRecord;
        if (causeMessages instanceof ObjectValidationError) {
            this.causeMessages = new Map();
            for (const property of causeMessages.causeProperties) {
                this.causeMessages.set(property as Column, causeMessages.getMessage(property));
            }
        } else {
            this.causeMessages = causeMessages;
        }
        this.causeColumns = [...this.causeMessages.keys()];
    }

    /**
     * 原因となったレコード。
     */
    public readonly causeRecord: RecordMap;

    /**
     * 原因となったカラム。
     */
    public readonly causeColumns: Column[];

    /**
     * 原因となったカラムとメッセージの連想配列。
     */
    private readonly causeMessages: Map<Column, string>;

    /**
     * 指定されたカラムのエラーメッセージを取得する。
     * 
     * @param causeColumn
     * @returns 
     */
    public getMessage(causeColumn: Column): string {
        const message = this.causeMessages.get(causeColumn);
        if (typeof message === "undefined") {
            return "";
        }
        return message;
    }
}
