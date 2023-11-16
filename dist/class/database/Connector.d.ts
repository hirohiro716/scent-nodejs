/// <reference types="node" />
import { Column, Datetime, RecordMap, StringObject, Table } from "scent-typescript";
import { WhereSet } from "./WhereSet.js";
/**
 * データベースに接続するための抽象クラス。
 *
 * @template A データベースに接続するためのアダプターの型。
 * @template P アダプターのデータベース接続に必要なパラメーターの型。
 */
export declare abstract class Connector<A, P> {
    /**
     * コンストラクタ。データベース接続アダプターの接続に使用するパラメーターを指定する。
     *
     * @param connectionParameters
     */
    protected constructor(connectionParameters: P);
    /**
     * データベース接続アダプターの接続に使用するパラメーター。
     */
    protected readonly connectionParameters: P;
    private _adapter;
    /**
     * データベースに接続するためのアダプターのインスタンス。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    get adapter(): A;
    /**
     * データベースに接続するためのアダプターを作成する。
     *
     * @param connectionParameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract createAdapter(connectionParameters: P): Promise<A>;
    /**
     * アダプターをデータベースに接続する。
     *
     * @param adapter
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract connectAdapter(adapter: A): Promise<void>;
    /**
     * データベースに接続する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    connect(): Promise<void>;
    private _statementTimeoutMilliseconds;
    /**
     * ステートメントを実行後に待機する最大時間のミリ秒。
     */
    get statementTimeoutMilliseconds(): number;
    set statementTimeoutMilliseconds(milliseconds: number);
    /**
     * アダプターにステートメントを実行後に待機する最大時間のミリ秒をセットする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract setStatementTimeoutToAdapter(milliseconds: number): Promise<void>;
    /**
     * 指定された値からプレースホルダーに使用できるバインド変数を作成する。
     *
     * @param value
     * @returns
     */
    protected abstract createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Date | Buffer;
    /**
     * アダプターを使用してデータベースレコードを変更するSQLを実行する。
     *
     * @param sql プレースホルダーを使用したSQL。
     * @param parameters バインド変数。
     * @returns 更新されたレコード数。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract executeByAdapter(sql: string, parameters?: any[]): Promise<number>;
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
     * アダプターを使用して取得したクエリの結果で、最初の行、最初のフィールドの値を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchFieldByAdapter(sql: string, parameters?: any[]): Promise<any>;
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
     * アダプターを使用して取得したクエリの結果で最初の行を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>>;
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
     * アダプターを使用して取得したクエリの結果を全行取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordsByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;
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
     * アダプターをデータベースから切断する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract closeAdapter(): Promise<void>;
    /**
     * データベース接続を閉じる。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    close(): Promise<void>;
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
/**
 * データベースへの処理に失敗した場合に発生するエラーのクラス。
 */
export declare class DatabaseError extends Error {
    /**
     * コンストラクタ。エラーメッセージとエラーコードを指定する。
     *
     * @param messages
     * @param code
     */
    constructor(message?: string, code?: string);
    /**
     * エラーコード。
     */
    readonly code: string | undefined;
}
/**
 * データが存在しない場合に発生するエラーのクラス。
 */
export declare class DataNotFoundError extends DatabaseError {
    /**
     * コンストラクタ。
     */
    constructor();
}
