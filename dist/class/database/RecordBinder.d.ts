import Connector from "./Connector.js";
import { Column, RecordMap, Table } from "scent-typescript";
import { WhereSet } from "./WhereSet.js";
/**
 * データベースのレコードとオブジェクトをバインドするための抽象クラス。
 *
 * @template C データベースコネクターの型。
 */
export default abstract class RecordBinder<C extends Connector<any, any>> {
    /**
     * コンストラクタ。接続済みデータベースインスタンスを指定する。
     *
     * @param connector
     */
    constructor(connector: C | null);
    private _connector;
    /**
     * 接続に使用するデータベースインスタンス。
     */
    get connector(): C;
    set connector(connector: C);
    /**
     * レコードが保存されているテーブルを取得する。
     *
     * @returns
     */
    abstract getTable(): Table<any>;
    /**
     * レコードのすべてのカラムを取得する。
     *
     * @returns
     */
    getColumns(): Column[];
    /**
     * 初期値が入力されたレコードを作成する。
     *
     * @returns
     */
    abstract createDefaultRecord(): Promise<RecordMap>;
    private _whereSet;
    /**
     * バインドするレコードを特定するための検索条件。
     */
    get whereSet(): WhereSet | null;
    set whereSet(whereSet: WhereSet);
    private editingRecords;
    /**
     * バインドされているレコード。
     */
    get records(): RecordMap[];
    set records(records: RecordMap[]);
    /**
     * バインドするレコードの並び順を定義するカラム文字列の配列を取得する。
     * @example
     * recordBinder.getOrderByColumnsForEdit() returns ["column_name1", "column_name2 ASC", "column_name3 DESC"]
     *
     * @returns
     */
    protected abstract getOrderByColumnsForEdit(): string[];
    /**
     * バインドするレコードを排他制御を行ってから取得する。
     *
     * @param orderByColumnsForEdit
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordsForEdit(orderByColumnsForEdit: string[]): Promise<Record<string, any>[]>;
    /**
     * データベースのレコードをこのインスタンスにバインドする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    edit(): Promise<void>;
    /**
     * 変更するレコードを特定するための検索条件が未指定の場合でも、更新を許可している場合はtrueを返す。
     *
     * @returns
     */
    protected abstract isPermittedUpdateWhenEmptySearchCondition(): boolean;
    /**
     * このインスタンスにバインドされているレコードでデータベースのレコードを上書きする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    update(): Promise<void>;
    /**
     * バインドするレコードを特定するための検索条件に該当するレコードが、データベースに存在する場合はtrueを返す。
     *
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    exists(): Promise<boolean>;
    /**
     * 指定されたレコードとカラムに対応する値の妥当性を確認する。
     *
     * @throws Error
     */
    abstract valueValidate(record: RecordMap, column: Column): Promise<void>;
    /**
     * バインドされているレコードが有効か検証する。
     */
    validate(): Promise<void>;
    /**
     * 指定されたレコードとカラムに対応する値を標準化して返す。undefinedを返す場合は値に対して何もしない。
     *
     * @returns
     */
    abstract valueNormalize(record: RecordMap, column: Column): Promise<any>;
    /**
     * バインドされているレコードの値を標準化する。
     */
    normalize(): Promise<void>;
}
