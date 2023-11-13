/// <reference types="node" />
import pg from "pg";
import { Database, DatabaseError } from "../Database.js";
import { Datetime, StringObject, Table } from "scent-typescript";
export type ConnectionParameters = {
    serverAddress: string;
    databaseName: string;
    user: string;
    password: string;
    maximumNumberOfConnections: number;
    portNumber?: number;
    connectionTimeoutMilliseconds?: number;
};
/**
 * PostgreSQLに接続するクラス。接続する前にコネクションプールを開始する必要がある。
 */
export default class PostgreSQL extends Database<pg.Pool, ConnectionParameters> {
    /**
     * コンストラクタ。接続に使用するパラメーターを指定する。
     *
     * @param connectionParameters
     */
    constructor(connectionParameters: ConnectionParameters);
    private static pools;
    /**
     * コネクションプールを開始する。
     */
    static poolStart(): void;
    /**
     * コネクションプールを終了する。
     *
     * @returns
     */
    static poolEnd(): Promise<void>;
    private _poolClient;
    /**
     * アダプターが生成したデータベースに接続するためのクライアントインスタンス。
     */
    get poolClient(): pg.PoolClient;
    protected createAdapter(connectionParameters: ConnectionParameters): Promise<pg.Pool>;
    protected connectAdapter(adapter: pg.Pool): Promise<void>;
    protected setStatementTimeoutToAdapter(milliseconds: number): Promise<void>;
    protected createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Date | Buffer;
    /**
     * 指定されたSQLのプレースホルダー(?)をpgで使用できる$nに修正する。
     *
     * @param sql
     * @returns
     */
    private fixPlaceholder;
    protected executeByAdapter(sql: string, parameters?: any[]): Promise<number>;
    protected fetchFieldByAdapter(sql: string, parameters?: any[]): Promise<any>;
    protected fetchRecordByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>>;
    protected fetchRecordsByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;
    existsTable(table: string | Table<any>): Promise<boolean>;
    fetchColumns(table: string | Table<any>): Promise<string[]>;
    /**
     * データベースサーバーの現在の時刻を取得する。
     *
     * @returns
     */
    fetchNow(): Promise<Datetime>;
    /**
     * 次のシーケンス値を取得する。
     *
     * @returns
     */
    fetchNextSequenceValue(name: string): Promise<any>;
    /**
     * テーブルの書き込みをロックする。
     *
     * @param table
     */
    lockTableAsReadonly(table: string | Table<any>): Promise<void>;
    /**
     * テーブルの読み取りと書き込みをロックする。
     *
     * @param table
     */
    lockTable(table: string | Table<any>): Promise<void>;
    begin(): Promise<void>;
    rollback(): Promise<void>;
    commit(): Promise<void>;
    protected closeAdapter(): Promise<void>;
    protected createErrorFromInnerError(error: pg.DatabaseError): DatabaseError;
}
