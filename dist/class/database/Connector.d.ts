import { Column, Datetime, RecordMap, StringObject, Table, WhereSet } from "scent-typescript";
import DatabaseError from "./DatabaseError.js";
/**
 * データベースに接続するための抽象クラス。
 *
 * @template D デリゲートの型。
 * @template C データベースに接続するためのパラメーターの型。
 */
export default abstract class Connector<D, C> {
    /**
     * トランザクションが開始されていない場合のエラーメッセージ。
     */
    static readonly TRANSACTION_NOT_STARTED_MESSAGE = "Transaction has not been started.";
    /**
     * コンストラクタ。データベース接続に使用するパラメーターを指定する。
     *
     * @param connectionParameters
     */
    protected constructor(connectionParameters: C);
    /**
     * データベース接続デリゲートの接続に使用するパラメーター。
     */
    protected readonly connectionParameters: C;
    private _delegate;
    /**
     * デリゲートのインスタンスが存在する場合はtrueを返す。
     *
     * @returns
     */
    existsDelegate(): boolean;
    /**
     * デリゲートのインスタンス。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    get delegate(): D;
    /**
     * データベースへの接続でエラーが発生している場合はtrue。
     */
    abstract get errorOccurred(): boolean;
    /**
     * 接続プールからデリゲートインスタンスを借りる。
     *
     * @param pool
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract borrowDelegateFromPool(): Promise<D>;
    /**
     * データベースに接続する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    connect(): Promise<void>;
    /**
     * デリゲートインスタンスを接続プールに解放する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract releaseDelegateToPool(): Promise<void>;
    /**
     * データベース接続を解放する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    release(): Promise<void>;
    private _statementTimeoutMilliseconds;
    /**
     * ステートメントを実行後に待機する最大時間のミリ秒。
     */
    get statementTimeoutMilliseconds(): number;
    set statementTimeoutMilliseconds(milliseconds: number);
    /**
     * デリゲートにステートメントを実行後に待機する最大時間のミリ秒をセットする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract setStatementTimeoutToDelegate(milliseconds: number): Promise<void>;
    /**
     * 指定された値からプレースホルダーに使用できるバインド変数を作成する。
     *
     * @param value
     * @returns
     */
    protected abstract createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Date | Buffer;
    /**
     * デリゲートを使ってデータベースレコードを変更するSQLを実行する。
     *
     * @param sql プレースホルダーを使用したSQL。
     * @param parameters バインド変数。
     * @returns 更新されたレコード数。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract executeByDelegate(sql: string, parameters?: any[]): Promise<number>;
    /**
     * データベースレコードを変更するSQLを実行する。
     *
     * @param sql プレースホルダーを使用したSQL。
     * @param parameters バインド変数。
     * @returns 更新されたレコード数。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    execute(sql: string, parameters?: any[]): Promise<number>;
    /**
     * データベースからデリゲートを使って取得したクエリの結果で、最初の行、最初のフィールドの値を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchFieldByDelegate(sql: string, parameters?: any[]): Promise<any>;
    /**
     * データベースから取得したクエリの結果で、最初の行、最初のフィールドの値を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    fetchField(sql: string, parameters?: any[]): Promise<any>;
    /**
     * データベースからデリゲートを使って取得したクエリの結果で最初の行を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>>;
    /**
     * データベースから取得したクエリの結果で最初の行を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    fetchRecord(sql: string, parameters?: any[]): Promise<Record<string, any>>;
    /**
     * データベースからデリゲートを使って取得したクエリの結果を全行取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordsByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;
    /**
     * データベースから取得したクエリの結果を全行取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    fetchRecords(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;
    /**
     * データベースに新しいレコードを追加する。
     *
     * @param record 追加するレコード。
     * @param table 対象のテーブル。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    insert(record: Record<string, any> | RecordMap, table: string | Table<any>): Promise<void>;
    /**
     * データベースのレコードを更新する。
     *
     * @param record 更新に使用するレコード。
     * @param table 対象のテーブル。
     * @param whereSet 更新対象を見つけるための検索条件。
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    update(record: Record<string, any> | RecordMap, table: string | Table<any>, whereSet: WhereSet): Promise<number>;
    /**
     * 指定されたテーブルが存在する場合はtrueを返す。
     *
     * @param table
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract existsTable(table: string | Table<any>): Promise<boolean>;
    /**
     * 指定されたテーブルのすべてのカラムを取得する。
     *
     * @param table
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract fetchColumns(table: string | Table<any>): Promise<string[]>;
    /**
     * トランザクションが開始されている場合はtrueを返す。
     *
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract isTransactionBegun(): Promise<boolean>;
    /**
     * トランザクションブロックを初期化する。以降の更新は全て明示的なコミットもしくはロールバックされるまで、単一のトランザクションの中で実行される。
     *
     * @param option
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract begin(option?: any): Promise<void>;
    /**
     * 現在のトランザクションをロールバックする。そのトランザクションで行われた全ての変更が廃棄される。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract rollback(): Promise<void>;
    /**
     * 現在のトランザクションをコミットする。 そのトランザクションで行われた全ての変更が確定される。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract commit(): Promise<void>;
    /**
     * それぞれのデータベース内部のエラーを元にDatabaseErrorを作成する。
     *
     * @param error
     * @returns
     */
    protected abstract createErrorFromInnerError(error: any): DatabaseError;
    /**
     * Mapインスタンスのキーと値の関連付けを利用してSQLのCASE句を作成する。
     * @example
     * const map = new Map<number, string>();
     * map.set(1, "aaa"); map.set(2, "bbb");
     * makeCaseClauseFromMap("col1", map) returns "CASE col1 WHEN 1 THEN 'aaa' WHEN 2 THEN 'bbb' END"
     *
     * @param column
     * @param object
     */
    static makeCaseClauseFromMap(column: Column | string, map: Map<number | string, string>): string;
    /**
     * オブジェクトのプロパティ名と値の関連付けを利用してSQLのCASE句を作成する。
     * @example
     * makeCaseClauseFromObject("col1", {"A": "aaa", "B": "bbb"}) returns "CASE col1 WHEN 'A' THEN 'aaa' WHEN 'B' THEN 'bbb' END"
     *
     * @param column
     * @param object
     */
    static makeCaseClauseFromObject(column: Column | string, object: Record<string, string>): string;
}
