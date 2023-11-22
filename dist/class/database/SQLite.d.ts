/// <reference types="node" />
import sqlite3 from "sqlite3";
import { Connector as ParentConnector, DatabaseError } from "./Connector.js";
import File from "./../filesystem/File.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
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
        private _isolationLevel;
        /**
         * トランザクションの分離レベル。
         */
        get isolationLevel(): "deferred" | "immediate" | "exclusive" | null;
        /**
         * @param isolationLevel
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        begin(isolationLevel: "deferred" | "immediate" | "exclusive"): Promise<void>;
        rollback(): Promise<void>;
        commit(): Promise<void>;
        protected closeAdapter(): Promise<void>;
        protected createErrorFromInnerError(error: any): DatabaseError;
    }
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class RecordBinder extends ParentRecordBinder<Connector> {
        protected fetchRecordsForEdit(orderByColumnsForEdit: string[]): Promise<Record<string, any>[]>;
        /**
         * バインドしようとしているレコードが、ほかで編集中かどうかを判定するメソッド。
         * このメソッドはスーパークラスの編集処理時に自動的に呼び出され、編集できるかの判定に使用される。
         *
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         * @returns
         */
        abstract isEditingByAnother(connector: Connector): Promise<boolean>;
        /**
         * バインドしたレコードをSQLiteデータベース上で編集中としてマークし、ほかのインスタンスからの編集を拒否する。このメソッドはスーパークラスの編集処理時に自動的に呼び出される。
         *
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         */
        protected abstract updateToEditing(connector: Connector): Promise<void>;
        /**
         * バインドしたレコードのSQLiteデータベース上での編集中マークを解除する。このメソッドはスーパークラスの閉じる処理で自動的に呼び出される。
         *
         * @param connector 接続済みのコネクター。
         */
        protected abstract updateToEditingFinish(connector: Connector): Promise<void>;
        /**
         * データベースに対して排他処理を行うための新しいコネクターインスタンスを作成する。接続処理はスーパークラスで自動的に行われる。
         *
         * @returns
         */
        abstract createConnectorForEditing(): Connector;
        private isEditing;
        edit(): Promise<void>;
        /**
         * バインドされているレコードを破棄して編集終了処理を実行する。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        close(): Promise<void>;
        /**
         * バインドしようとしているレコードの編集中を強制的に解除するメソッド。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        forciblyClose(): Promise<void>;
    }
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class SingleRecordBinder extends ParentSingleRecordBinder<Connector> {
        protected fetchRecordForEdit(): Promise<Record<string, any>>;
        /**
         * バインドしようとしているレコードが、ほかで編集中かどうかを判定するメソッド。
         * このメソッドはスーパークラスの編集処理時に自動的に呼び出され、編集できるかの判定に使用される。
         *
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         * @returns
         */
        abstract isEditingByAnother(connector: Connector): Promise<boolean>;
        /**
         * バインドしたレコードをSQLiteデータベース上で編集中としてマークし、ほかのインスタンスからの編集を拒否する。このメソッドはスーパークラスの編集処理時に自動的に呼び出される。
         *
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         */
        protected abstract updateToEditing(connector: Connector): Promise<void>;
        /**
         * バインドしたレコードのSQLiteデータベース上での編集中マークを解除する。このメソッドはスーパークラスの閉じる処理で自動的に呼び出される。
         *
         * @param connector 接続済みのコネクター。
         */
        protected abstract updateToEditingFinish(connector: Connector): Promise<void>;
        /**
         * データベースに対して排他処理を行うための新しいコネクターインスタンスを作成する。接続処理はスーパークラスで自動的に行われる。
         *
         * @returns
         */
        abstract createConnectorForEditing(): Connector;
        private isEditing;
        edit(): Promise<void>;
        /**
         * 指定されたコネクターを使用してデータベースのレコードをこのインスタンスにバインドする。
         *
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        editByConnector(connector: Connector): Promise<void>;
        /**
         * バインドされているレコードを破棄して編集終了処理を実行する。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        close(): Promise<void>;
        /**
         * 指定されたコネクターを使用して編集終了処理を実行してバインドされているレコードを破棄する。
         *
         * @param connector 接続済みのコネクター。
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        closeByConnector(connector: Connector): Promise<void>;
        /**
         * バインドしようとしているレコードの編集中を強制的に解除するメソッド。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        forciblyClose(): Promise<void>;
        /**
         * 指定されたコネクターを使用してバインドしようとしているレコードの編集中を強制的に解除するメソッド。
         *
         * @param connector 接続済みのコネクター。
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        forciblyCloseByConnector(connector: Connector): Promise<void>;
    }
    export {};
}
