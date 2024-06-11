import DatabaseError from "./DatabaseError.js";

/**
 * データが存在しない場合に発生するエラーのクラス。
 */
export default class DataNotFoundError extends DatabaseError {

    /**
     * コンストラクタ。
     */
    public constructor() {
        super("Data does not exist.");
    }
}
