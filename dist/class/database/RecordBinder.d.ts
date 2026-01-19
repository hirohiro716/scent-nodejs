import Connector from "./Connector.js";
import { Column, RecordMap, Table, WhereSet } from "scent-typescript";
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
     * 指定されたレコードの識別子を取得する。
     *
     * @param record
     * @returns
     */
    abstract getIdentifier(record: RecordMap): string;
    /**
     * 指定されたレコードの最終更新日時を取得する。更新日時の概念が無い場合はnullを返す。
     *
     * @param record
     * @returns
     */
    protected abstract getLastUpdateTime(record: RecordMap): Date | null;
    /**
     * バインドするレコードの並び順を定義するカラム文字列の配列を取得する。
     * @example
     * recordBinder.getOrderByColumnsForEdit() returns ["column_name1", "column_name2 ASC", "column_name3 DESC"]
     *
     * @returns
     */
    protected abstract getOrderByColumnsForEdit(): string[];
    private _preEditRecords;
    private idAndPreEditRecord;
    /**
     * 編集開始時のデータベースレコードのクローン。コンフリクトの検出に使用される。
     *
     * @returns
     */
    get preEditRecords(): ReadonlyArray<RecordMap> | null;
    set preEditRecords(preEditRecords: RecordMap[]);
    /**
     * 指定されたレコードの編集前のレコードを返す。見つからない場合はnullを返す。
     *
     * @param record
     * @returns
     */
    findPreEditRecord(record: RecordMap): RecordMap | null;
    /**
     * 指定されたレコードとカラムのフィールドの編集前の値を返す。編集前のレコードが見つからない場合はundefinedを返す。
     *
     * @param record
     * @param column
     * @returns
     */
    findPreEditRecordValue(record: RecordMap, column: Column): any | undefined;
    /**
     * 指定されたレコードが、既存レコードが変更されたもの、または新規レコードの場合にtrueを返す。
     *
     * @param record
     * @param excludeColumns
     * @returns
     */
    protected isModified(record: RecordMap, excludeColumns: Column[]): boolean;
    /**
     * 編集するためのレコードを取得する。
     *
     * @returns
     * @throws DatabaseError
     */
    private fetchRecordsForEdit;
    /**
     * データベースのレコードを編集してこのインスタンスにバインドする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    edit(): Promise<void>;
    private _isConflictIgnored;
    /**
     * 変更するレコードを特定するための検索条件が未指定の場合でも、更新を許可している場合はtrueを返す。
     *
     * @returns
     */
    protected abstract isPermittedUpdateWhenEmptySearchCondition(): boolean;
    /**
     * コンフリクトを無視する場合はtrue。
     */
    get isConflictIgnored(): boolean;
    set isConflictIgnored(isConflictIgnored: boolean);
    /**
     * コンフリクトを検出する。
     *
     * @throws RecordConflictError データベースレコードがコンフリクトした場合。
     */
    protected detectConflict(): Promise<void>;
    /**
     * このインスタンスにバインドされているレコードでデータベースのレコードを上書きする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     * @throws RecordConflictError データベースレコードがコンフリクトした場合。
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
     *
     * @throws RecordMapValidationError 検証に失敗した場合。
     */
    validate(): Promise<void>;
    /**
     * 指定されたレコードとカラムに対応する値を標準化して返す。undefinedを返す場合は値に対して何もしない。
     *
     * @returns
     * @throws Error
     */
    abstract valueNormalize(record: RecordMap, column: Column): Promise<any>;
    /**
     * バインドされているレコードの値を標準化する。
     */
    normalize(): Promise<void>;
}
