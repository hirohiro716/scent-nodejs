import sqlite3 from "sqlite3";
import { default as ParentPool } from "./Pool.js";
import { default as ParentConnector } from "./Connector.js";
import File from "./../filesystem/File.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
import DatabaseError from "./DatabaseError.js";
/**
 * SQLiteデータベース関連のクラス。
 */
export declare namespace SQLite {
    type ConnectionParameters = {
        databaseFile: File;
    };
    /**
     * SQLiteへの接続をプールするクラス。
     */
    export class Pool extends ParentPool<void, ConnectionParameters, sqlite3.Database> {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters: ConnectionParameters);
        private maximumNumberOfConnections;
        private borrowingStatus;
        private connectorDelegates;
        borrowConnectorDelegate(): Promise<sqlite3.Database>;
        releaseConnectorDelegate(connectorDelegate: sqlite3.Database, errorOccurred: boolean): Promise<void>;
        /**
         * 指定されたコネクターのデリゲートインスタンスを閉じる。
         *
         * @param connectorDelegate
         */
        private closeConnectorDelegate;
        end(): Promise<void>;
        protected createErrorFromInnerError(error: any): DatabaseError;
    }
    /**
     * SQLiteに接続するクラス。接続する前にコネクションプールを開始する必要がある。
     */
    export class Connector extends ParentConnector<sqlite3.Database, ConnectionParameters> {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters: ConnectionParameters);
        private _errorOccurred;
        get errorOccurred(): boolean;
        private static readonly errorMonitoringDelegates;
        protected borrowDelegateFromPool(): Promise<sqlite3.Database>;
        protected releaseDelegateToPool(): Promise<void>;
        protected setStatementTimeoutToDelegate(milliseconds: number): Promise<void>;
        protected createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Buffer;
        protected executeByDelegate(sql: string, parameters?: any[]): Promise<number>;
        protected fetchFieldByDelegate(sql: string, parameters?: any[]): Promise<any>;
        protected fetchRecordByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>>;
        protected fetchRecordsByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;
        existsTable(table: string | Table): Promise<boolean>;
        fetchColumns(table: string | Table): Promise<string[]>;
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
        private _isTransactionBegun;
        isTransactionBegun(): Promise<boolean>;
        private _isolationLevel;
        /**
         * トランザクションの分離レベル。
         */
        get isolationLevel(): IsolationLevel | null;
        /**
         * @param isolationLevel
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        begin(isolationLevel: IsolationLevel): Promise<void>;
        rollback(): Promise<void>;
        commit(): Promise<void>;
        protected createErrorFromInnerError(error: any): DatabaseError;
    }
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class RecordBinder extends ParentRecordBinder<Connector> {
    }
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class SingleRecordBinder extends ParentSingleRecordBinder<Connector> {
    }
    export {};
}
/**
 * トランザクションの分離レベル列挙型。
 */
export declare enum IsolationLevel {
    /**
     * 最初のデータベースへのアクセス(SELECTやUPDATEなど)が発生した際にロックが取得されます。
     * SELECTが最初の操作なら共有ロックが取得され、データを読み取ることができますが、書き込みはまだできません。
     * INSERT、UPDATE、DELETEなどの書き込み操作が行われたときに、SQLiteは排他ロックを取得します。
     */
    deferred = "deferred",
    /**
     * トランザクションの開始時点で即座に予約ロック(後に書き込みをする意図があるロック)が取得されます。
     * 予約ロックは、他のトランザクションがデータベースへの書き込みを行うことを防ぎますが、
     * 他のトランザクションはまだデータの読み取りを行うことができます(共有ロックは許可されます)。
     * トランザクション内で実際にデータの書き込みが発生した場合に、SQLiteは排他ロックにエスカレートします。
     */
    immediate = "immediate",
    /**
     * トランザクションの開始時に、データベース全体に対する排他ロックが即座に取得されます。
     * このロックにより、他のトランザクションは読み取りも書き込みもできなくなります。
     * トランザクションが終了するまで、他のプロセスやスレッドがデータベースにアクセスできないため、
     * 他のトランザクションを完全にブロックします。
    */
    exclusive = "exclusive"
}
