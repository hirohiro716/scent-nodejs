import sqlite3 from "sqlite3";
import { default as ParentPool } from "./Pool.js";
import { default as ParentConnector } from "./Connector.js";
import File from "./../filesystem/File.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
import DatabaseError from "./DatabaseError.js";
import DataNotFoundError from "./DataNotFoundError.js";

/**
 * SQLiteデータベース関連のクラス。
 */
export namespace SQLite {

    type ConnectionParameters = {
        databaseFile: File
    }

    /**
     * SQLiteへの接続をプールするクラス。
     */
    export class Pool extends ParentPool<void, ConnectionParameters, sqlite3.Database> {

        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         * 
         * @param connectionParameters 
         */
        public constructor(connectionParameters: ConnectionParameters) {
            super(undefined, connectionParameters);
            this.maximumNumberOfConnections = Pool.maximumNumberOfConnections;
            this.borrowingStatus = new Int32Array(this.maximumNumberOfConnections);
        }

        private maximumNumberOfConnections: number;

        private borrowingStatus: Int32Array;

        private connectorDelegates: (sqlite3.Database | undefined)[] = [];

        public async borrowConnectorDelegate(): Promise<sqlite3.Database> {
            let barrowedIndex = -1;
            for (let index = 0; index < this.maximumNumberOfConnections - 1; index++) {
                if (Atomics.compareExchange(this.borrowingStatus, index, 0, 1) === 0) {
                    barrowedIndex = index;
                    break;
                }
            }
            if (barrowedIndex > -1) {
                let connectorDelegate = this.connectorDelegates[barrowedIndex];
                if (typeof connectorDelegate !== "undefined") {
                    return connectorDelegate;
                }
                return new Promise<sqlite3.Database>((resolve, reject) => {
                    const database = new sqlite3.Database(this.connectionParameters.databaseFile.getAbsolutePath(), (error: any) => {
                        if (error) {
                            reject(error);
                        } else {
                            this.connectorDelegates[barrowedIndex] = database;
                            resolve(database);
                        }
                    });
                });
            } else {
                return new Promise<sqlite3.Database>((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            const database = await this.borrowConnectorDelegate();
                            resolve(database);
                        } catch (error: any) {
                            reject(error);
                        }
                    }, 100);
                });
            }
        }

        public async releaseConnectorDelegate(connectorDelegate: sqlite3.Database, errorOccurred: boolean): Promise<void> {
            const index = this.connectorDelegates.indexOf(connectorDelegate);
            if (index === -1) {
                throw new DatabaseError("Connectors that are not managed by a pool cannot be released.");
            }
            if (errorOccurred) {
                connectorDelegate.close();
                this.connectorDelegates[index] = undefined;
            }
            Atomics.store(this.borrowingStatus, index, 0);
            Atomics.notify(this.borrowingStatus, index);
        }

        /**
         * 指定されたコネクターのデリゲートインスタンスを閉じる。
         * 
         * @param connectorDelegate 
         */
        private closeConnectorDelegate(connectorDelegate: sqlite3.Database | undefined): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                if (typeof connectorDelegate === "undefined") {
                    resolve();
                } else {
                    connectorDelegate.close((error: any) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        }

        public async end(): Promise<void> {
            let throwLater: Error | null = null;
            for (let index = 0; index < this.maximumNumberOfConnections - 1; index++) {
                const connectorDelegate = this.connectorDelegates[index];
                try {
                    await this.closeConnectorDelegate(connectorDelegate);
                    this.connectorDelegates[index] = undefined;
                } catch (error: any) {
                    throwLater = error;
                }
            }
            if (throwLater !== null) {
                throw throwLater;
            }
        }

        protected createErrorFromInnerError(error: any): DatabaseError {
            return new DatabaseError(error.message, error.errno);
        }
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
        public constructor(connectionParameters: ConnectionParameters) {
            super(connectionParameters);
        }

        private _errorOccurred: boolean = false;

        public get errorOccurred(): boolean {
            return this._errorOccurred;
        }

        protected async borrowDelegateFromPool(): Promise<sqlite3.Database> {
            let pool = Pool.get(this.connectionParameters);
            if (typeof pool === "undefined") {
                pool = new Pool(this.connectionParameters);
                Pool.put(this.connectionParameters, pool);
            }
            const delegate: sqlite3.Database = await pool.borrowConnectorDelegate();
            delegate.addListener("error", () => {
                this._errorOccurred = true;
            });
            return delegate;
        }

        protected async releaseDelegateToPool(): Promise<void> {
            const pool = Pool.get(this.connectionParameters);
            if (typeof pool !== "undefined" && this.existsDelegate()) {
                pool.releaseConnectorDelegate(this.delegate, this._errorOccurred);
            }
        }

        protected setStatementTimeoutToDelegate(milliseconds: number): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                this.delegate.run(StringObject.join(["PRAGMA busy_timeout = ", milliseconds, ";"]).toString(), (error: any) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }
    
        protected createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Buffer {
            if (value instanceof StringObject) {
                return value.toString();
            }
            if (value instanceof Date) {
                return Datetime.from(value).toString();
            }
            if (value instanceof Datetime) {
                return value.toString();
            }
            return value;
        }
    
        protected executeByDelegate(sql: string, parameters?: any[]): Promise<number> {
            return new Promise<number>((resolve, reject) => {
                this.delegate.run(sql, parameters, (error: any) => {
                    if (error) {
                        reject(error);
                    } else {
                        this.fetchNumberOfRecordsLastUpdated().then((count: number) => {
                            resolve(count);
                        }).catch((error: any) => {
                            reject(error);
                        });
                    }
                });
            });
        }
    
        protected fetchFieldByDelegate(sql: string, parameters?: any[]): Promise<any> {
            return new Promise<any>((resolve, reject) => {
                this.delegate.get(sql, parameters, (error: any, row: Record<string, any>) => {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            const keys = Object.keys(row);
                            resolve(row[keys[0]]);
                        } catch (error: any) {
                            reject(new DataNotFoundError());
                        }
                    }
                });
            });
        }
    
        protected fetchRecordByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>> {
            return new Promise<Record<string, any>>((resolve, reject) => {
                this.delegate.get(sql, parameters, (error: any, row: Record<string, any>) => {
                    if (error) {
                        reject(error);
                    } else {
                        if (row) {
                            resolve(row);
                        } else {
                            reject(new DataNotFoundError());
                        }
                    }
                });
            });
        }
    
        protected fetchRecordsByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>[]> {
            return new Promise<Record<string, any>[]>((resolve, reject) => {
                this.delegate.all(sql, parameters, (error: any, rows: Record<string, any>[]) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }
    
        public async existsTable(table: string | Table<any>): Promise<boolean> {
            let tableName: string;
            if (table instanceof Table) {
                tableName = table.physicalName;
            } else {
                tableName = table;
            }
            const numberOfTables: number = await this.fetchField("SELECT COUNT(*) FROM sqlite_master WHERE type = ? AND name = ?;", ["table", tableName]);
            return (numberOfTables > 0);
        }
    
        public async fetchColumns(table: string | Table<any>): Promise<string[]> {
            let tableName: string;
            if (table instanceof Table) {
                tableName = table.physicalName;
            } else {
                tableName = table;
            }
            const columns: string[] = [];
            for (const record of await this.fetchRecords("PRAGMA table_info(?)", [tableName])) {
                columns.push(record["name"]);
            }
            return columns;
        }
    
        /**
         * 最後に更新したレコード数を取得する。レコードを更新したコネクションと同じ接続内で実行する必要がある。
         * 
         * @returns 
         */
        public fetchNumberOfRecordsLastUpdated(): Promise<number> {
            return this.fetchField("SELECT CHANGES();");
        }
    
        /**
         * 最後に挿入したレコードのIDを取得する。レコードを挿入したコネクションと同じ接続内で実行する必要がある。
         * 
         * @returns 
         */
        public fetchLastInsertedRecordID(): Promise<number> {
            return this.fetchField("SELECT LAST_INSERT_ROWID();");
        }

        private _isTransactionBegun: boolean = false;

        public async isTransactionBegun(): Promise<boolean> {
            return this._isTransactionBegun;
        }

        private _isolationLevel: "deferred" |  "immediate" | "exclusive" | null = null

        /**
         * トランザクションの分離レベル。
         */
        public get isolationLevel(): "deferred" |  "immediate" | "exclusive" | null {
            return this._isolationLevel;
        }
    
        /**
         * @param isolationLevel
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public async begin(isolationLevel: "deferred" |  "immediate" | "exclusive"): Promise<void> {
            this._isolationLevel = isolationLevel;
            const sql = new StringObject("BEGIN ");
            sql.append(isolationLevel);
            sql.append(";");
            await this.execute(sql.upper().toString());
            this._isTransactionBegun = true;
        }

        public async rollback(): Promise<void> {
            this._isolationLevel = null;
            await this.execute("ROLLBACK;");
            this._isTransactionBegun = false;
        }
    
        public async commit(): Promise<void> {
            this._isolationLevel = null;
            await this.execute("COMMIT;")
            this._isTransactionBegun = false;
        }
    
        protected createErrorFromInnerError(error: any): DatabaseError {
            return new DatabaseError(error.message, error.errno);
        }
    }

    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class RecordBinder extends ParentRecordBinder<Connector> {

        protected async fetchRecordsForEdit(orderByColumnsForEdit: string[]): Promise<Record<string, any>[]> {
            if (this.connector === null) {
                throw new DatabaseError("Connector instance is missing.");
            }
            const orderBy = new StringObject();
            if (orderByColumnsForEdit.length > 0) {
                orderBy.append(" ORDER BY ");
                for (const orderByColumn of orderByColumnsForEdit) {
                    if (orderBy.length() > 10) {
                        orderBy.append(", ");
                    }
                    orderBy.append(orderByColumn);
                }
            }
            const sql = new StringObject("SELECT * FROM ");
            sql.append(this.getTable().physicalName);
            if (this.whereSet === null) {
                sql.append(orderBy);
                sql.append(";");
                return await this.connector.fetchRecords(sql.toString());
            }
            sql.append(" WHERE ");
            sql.append(this.whereSet.buildPlaceholderClause());
            sql.append(" ");
            sql.append(orderBy);
            sql.append(";");
            return this.connector.fetchRecords(sql.toString(), this.whereSet.buildParameters());
        }

        /**
         * バインドしようとしているレコードが、ほかで編集中かどうかを判定するメソッド。
         * このメソッドはスーパークラスの編集処理時に自動的に呼び出され、編集できるかの判定に使用される。
         * 
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         * @returns
         */
        public abstract isEditingByAnother(connector: Connector): Promise<boolean>;

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
        public abstract createConnectorForEditing(): Connector;

        private isEditing: boolean = false;

        public async edit(): Promise<void> {
            if (this.isEditing) {
                return;
            }
            await super.edit();
            const connector = this.createConnectorForEditing();
            try {
                await connector.connect();
                await connector.begin("exclusive");
                if (await this.isEditingByAnother(connector)) {
                    throw new DatabaseError("The record is being edited by another.");
                }
                await this.updateToEditing(connector);
                await connector.commit();
                this.isEditing = true;
            } finally {
                try {
                    await connector.release();
                } catch (error: any) {
                    // nop
                }
            }
        }

        /**
         * バインドされているレコードを破棄して編集終了処理を実行する。
         * 
         * @throws DatabaseError データベースの処理に失敗した場合。 
         */
        public async close(): Promise<void> {
            if (this.isEditing) {
                const connector = this.createConnectorForEditing();
                try {
                    await connector.connect();
                    await this.updateToEditingFinish(connector);
                } finally {
                    await connector.release();
                }     
                this.isEditing = true;
            }
            this.records = [];
        }

        /**
         * バインドしようとしているレコードの編集中を強制的に解除するメソッド。
         * 
         * @throws DatabaseError データベースの処理に失敗した場合。 
         */
        public async forciblyClose(): Promise<void> {
            const connector = this.createConnectorForEditing();
            try {
                await connector.connect();
                await this.updateToEditingFinish(connector);
            } finally {
                await connector.release();
            }
            this.records = [];
        }
    }

    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    export abstract class SingleRecordBinder extends ParentSingleRecordBinder<Connector> {

        protected async fetchRecordForEdit(): Promise<Record<string, any>> {
            if (this.connector === null) {
                throw new DatabaseError("Connector instance is missing.");
            }
            if (this.whereSet === null) {
                throw new DatabaseError("Search condition for editing is missing.");
            }
            const sql = new StringObject("SELECT * FROM ");
            sql.append(this.getTable().physicalName);
            sql.append(" WHERE ");
            sql.append(this.whereSet.buildPlaceholderClause());
            sql.append(";");
            return await this.connector.fetchRecord(sql.toString(), this.whereSet.buildParameters());
        }

        /**
         * バインドしようとしているレコードが、ほかで編集中かどうかを判定するメソッド。
         * このメソッドはスーパークラスの編集処理時に自動的に呼び出され、編集できるかの判定に使用される。
         * 
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         * @returns
         */
        public abstract isEditingByAnother(connector: Connector): Promise<boolean>;

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
        public abstract createConnectorForEditing(): Connector;

        private isEditing: boolean = false;

        public async edit(): Promise<void> {
            if (this.isEditing) {
                return;
            }
            await super.edit();
            const connector = this.createConnectorForEditing();
            try {
                await connector.connect();
                await connector.begin("exclusive");
                if (await this.isEditingByAnother(connector)) {
                    throw new DatabaseError("The record is being edited by another.");
                }
                await this.updateToEditing(connector);
                await connector.commit();
                this.isEditing = true;
            } finally {
                try {
                    await connector.release();
                } catch (error: any) {
                    // nop
                }
            }
        }

        /**
         * 指定されたコネクターを使用してデータベースのレコードをこのインスタンスにバインドする。
         * 
         * @param connector 分離レベル"exclusive"でトランザクションが開始されたコネクター。
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public async editByConnector(connector: Connector): Promise<void> {
            if (this.isEditing) {
                return;
            }
            await super.edit();
            if (await this.isEditingByAnother(connector)) {
                throw new DatabaseError("The record is being edited by another.");
            }
            await this.updateToEditing(connector);
            this.isEditing = true;
        }

        /**
         * バインドされているレコードを破棄して編集終了処理を実行する。
         * 
         * @throws DatabaseError データベースの処理に失敗した場合。 
         */
        public async close(): Promise<void> {
            if (this.isEditing) {
                const connector = this.createConnectorForEditing();
                try {
                    await connector.connect();
                    await this.updateToEditingFinish(connector);
                } finally {
                    await connector.release();
                }     
                this.isEditing = false;
            }
            this.record = this.getTable().createRecord();
        }

        /**
         * 指定されたコネクターを使用して編集終了処理を実行してバインドされているレコードを破棄する。
         * 
         * @param connector 接続済みのコネクター。
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public async closeByConnector(connector: Connector): Promise<void> {
            if (this.isEditing) {
                await this.updateToEditingFinish(connector);
                this.isEditing = false;
            }
            this.record = this.getTable().createRecord();
        }

        /**
         * バインドしようとしているレコードの編集中を強制的に解除するメソッド。
         * 
         * @throws DatabaseError データベースの処理に失敗した場合。 
         */
        public async forciblyClose(): Promise<void> {
            const connector = this.createConnectorForEditing();
            try {
                await connector.connect();
                await this.updateToEditingFinish(connector);
                this.isEditing = false;
            } finally {
                await connector.release();
            }
            this.record = this.getTable().createRecord();
        }

        /**
         * 指定されたコネクターを使用してバインドしようとしているレコードの編集中を強制的に解除するメソッド。
         * 
         * @param connector 接続済みのコネクター。
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public async forciblyCloseByConnector(connector: Connector): Promise<void> {
            await this.updateToEditingFinish(connector);
            this.isEditing = false;
            this.record = this.getTable().createRecord();
        }
    }
}
