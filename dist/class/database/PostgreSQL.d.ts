import pg from "pg";
import { default as ParentConnector } from "./Connector.js";
import { default as ParentPool } from "./Pool.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
import DatabaseError from "./DatabaseError.js";
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
     * PostgreSQLへの接続をプールするクラス。
     */
    export class Pool extends ParentPool<pg.Pool, ConnectionParameters, pg.PoolClient> {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters: ConnectionParameters);
        borrowConnectorDelegate(): Promise<pg.PoolClient>;
        releaseConnectorDelegate(connectorDelegate: pg.PoolClient, errorOccurred: boolean): Promise<void>;
        protected end(): Promise<void>;
        protected createErrorFromInnerError(error: pg.DatabaseError): DatabaseError;
    }
    /**
     * PostgreSQLに接続するクラス。接続する前にコネクションプールを開始する必要がある。
     */
    export class Connector extends ParentConnector<pg.PoolClient, ConnectionParameters> {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters: ConnectionParameters);
        private _errorOccurred;
        get errorOccurred(): boolean;
        protected borrowDelegateFromPool(): Promise<pg.PoolClient>;
        protected releaseDelegateToPool(): Promise<void>;
        protected setStatementTimeoutToDelegate(milliseconds: number): Promise<void>;
        protected createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Date | Buffer;
        /**
         * 指定されたSQLのプレースホルダー(?)をpgで使用できる$nに修正する。
         *
         * @param sql
         * @returns
         */
        private fixPlaceholder;
        protected executeByDelegate(sql: string, parameters?: any[]): Promise<number>;
        protected fetchFieldByDelegate(sql: string, parameters?: any[]): Promise<any>;
        protected fetchRecordByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>>;
        protected fetchRecordsByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;
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
        private _isTransactionBegun;
        isTransactionBegun(): Promise<boolean>;
        begin(): Promise<void>;
        rollback(): Promise<void>;
        commit(): Promise<void>;
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
