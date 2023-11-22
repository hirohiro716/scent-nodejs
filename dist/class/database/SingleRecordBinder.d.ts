import { RecordMap } from "scent-typescript";
import { Connector as ParentConnector } from "./Connector.js";
import RecordBinder from "./RecordBinder.js";
/**
 * データベースの単一レコードとオブジェクトをバインドするための抽象クラス。
 *
 * @template C データベースコネクターの型。
 */
export default abstract class SingleRecordBinder<C extends ParentConnector<any, any>> extends RecordBinder<C> {
    /**
     * @deprecated
     */
    get records(): RecordMap[];
    /**
     * @deprecated
     */
    set records(records: RecordMap[]);
    /**
     * バインドされているレコード。
     */
    get record(): RecordMap;
    set record(record: RecordMap);
    /**
     * 初期値が入力されたレコードをセットする。
     */
    setDefaultRecord(): Promise<void>;
    /**
     * このインスタンスにバインドされているレコードをデータベースに追加する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    insert(): Promise<void>;
    /**
     * バインドするレコードを排他制御を行ってから取得する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     * @returns
     */
    protected abstract fetchRecordForEdit(): Promise<Record<string, any>>;
    protected getOrderByColumnsForEdit(): string[];
    protected fetchRecordsForEdit(orderByColumnsForEdit: string[]): Promise<Record<string, any>[]>;
    protected isPermittedUpdateWhenEmptySearchCondition(): boolean;
    /**
     * バインドされたレコードが、すでに削除されている場合trueを返す。テーブルが論理削除仕様の場合にtrueかfalseを返し、物理削除仕様の場合は常にfalseを返す。
     *
     * @returns
     */
    abstract isDeleted(): boolean;
    /**
     * データベースのレコードをこのインスタンスにバインドする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    edit(): Promise<void>;
    /**
     * このインスタンスにバインドされているレコードでデータベースのレコードを上書きする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    update(): Promise<void>;
    /**
     * 設定されている検索条件に該当するレコードをデータベースから物理削除する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    physicalDelete(): Promise<void>;
    /**
     * バインドされているレコードを削除処理する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract delete(): Promise<void>;
}
