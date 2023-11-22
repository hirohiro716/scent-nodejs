/// <reference types="node" />
import pg from "pg";
import { Connector as ParentConnector, DatabaseError } from "./Connector.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
/**
 * PostgreSQLデータベース関連のクラス。
 */
export declare namespace PostgreSQL {
    type ConnectionParameters = {
        serverAddress: string;
        databaseName: string;
        user: string;
        password: string;
        portNumber?: number;
        connectionTimeoutMilliseconds?: number;
    };
    /**
     * PostgreSQLに接続するクラス。接続する前にコネクションプールを開始する必要がある。
     */
    export class Connector extends ParentConnector<pg.Pool, ConnectionParameters> {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters: ConnectionParameters);
        private static pools;
        private static maximumNumberOfConnections;
        /**
         * 許容する最大接続数を指定してコネクションプールを開始する。
         *
         * @param maximumNumberOfConnections
         */
        static poolStart(maximumNumberOfConnections: number): void;
        /**
         * コネクションプールを終了する。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        static poolEnd(): Promise<void>;
        private _poolClient;
        /**
         * アダプターが生成したデータベースに接続するためのクライアントインスタンス。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
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
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        fetchNow(): Promise<Datetime>;
        /**
         * 次のシーケンス値を取得する。
         *
         * @returns
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        fetchNextSequenceValue(name: string): Promise<any>;
        /**
         * テーブルの書き込みをロックする。
         *
         * @param table
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        lockTableAsReadonly(table: string | Table<any>): Promise<void>;
        /**
         * テーブルの読み取りと書き込みをロックする。
         *
         * @param table
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        lockTable(table: string | Table<any>): Promise<void>;
        begin(): Promise<void>;
        rollback(): Promise<void>;
        commit(): Promise<void>;
        protected closeAdapter(): Promise<void>;
        protected createErrorFromInnerError(error: pg.DatabaseError): DatabaseError;
    }
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class RecordBinder extends ParentRecordBinder<Connector> {
        protected fetchRecordsForEdit(orderByColumnsForEdit: string[]): Promise<Record<string, any>[]>;
    }
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class SingleRecordBinder extends ParentSingleRecordBinder<Connector> {
        protected fetchRecordForEdit(): Promise<Record<string, any>>;
    }
    export {};
}
