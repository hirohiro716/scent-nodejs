import { ObjectValidationError } from "scent-typescript";
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
    constructor(causeRecord, causeMessages) {
        super("データベースレコードの妥当性確認に失敗しました。");
        this.causeRecord = causeRecord;
        if (causeMessages instanceof ObjectValidationError) {
            this.causeMessages = new Map();
            for (const property of causeMessages.causeProperties) {
                this.causeMessages.set(property, causeMessages.getMessage(property));
            }
        }
        else {
            this.causeMessages = causeMessages;
        }
        this.causeColumns = [...this.causeMessages.keys()];
    }
    /**
     * 指定されたカラムのエラーメッセージを取得する。
     *
     * @param causeColumn
     * @returns
     */
    getMessage(causeColumn) {
        const message = this.causeMessages.get(causeColumn);
        if (typeof message === "undefined") {
            return "";
        }
        return message;
    }
}
