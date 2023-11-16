/// <reference types="node" />
import { Datetime, StringObject, Table } from "scent-typescript";
import File from "./../filesystem/File.js";
import { Connector as ParentConnector, DatabaseError } from "./Connector.js";
import sqlite3 from "sqlite3";
/**
 * SQLiteデータベース関連のクラス。
 */
export declare namespace SQLite {
    type ConnectionParameters = {
        databaseFile: File;
    };
    /**
     * SQLiteに接続するクラス。
     */
    export class Connector extends ParentConnector<sqlite3.Database, ConnectionParameters> {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters: ConnectionParameters);
        protected createAdapter(connectionParameters: ConnectionParameters): Promise<sqlite3.Database>;
        protected connectAdapter(adapter: sqlite3.Database): Promise<void>;
        protected setStatementTimeoutToAdapter(milliseconds: number): Promise<void>;
        protected createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Buffer;
        protected executeByAdapter(sql: string, parameters?: any[]): Promise<number>;
        protected fetchFieldByAdapter(sql: string, parameters?: any[]): Promise<any>;
        protected fetchRecordByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>>;
        protected fetchRecordsByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;
        existsTable(table: string | Table<any>): Promise<boolean>;
        fetchColumns(table: string | Table<any>): Promise<string[]>;
        /**
         * 最後に更新したレコード数を取得する。レコードを更新したコネクションと同じ接続内で実行する必要がある。
         *
         * @returns
         */
        fetchNumberOfRecordsLastUpdated(): Promise<number>;
        /**
         * 最後に挿入したレコードのIDを取得する。レコードを挿入したコネクションと同じ接続内で実行する必要がある。
         *
         * @returns
         */
        fetchLastInsertedRecordID(): Promise<number>;
        begin(mode: "deferred" | "immediate" | "exclusive"): Promise<void>;
        rollback(): Promise<void>;
        commit(): Promise<void>;
        protected closeAdapter(): Promise<void>;
        protected createErrorFromInnerError(error: any): DatabaseError;
    }
    export {};
}
