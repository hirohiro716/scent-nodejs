import sqlite3 from "sqlite3";
import { default as ParentPool } from "./Pool.js";
import { default as ParentConnector } from "./Connector.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
import DatabaseError from "./DatabaseError.js";
import DataNotFoundError from "./DataNotFoundError.js";
/**
 * SQLiteデータベース関連のクラス。
 */
export var SQLite;
(function (SQLite) {
    /**
     * SQLiteへの接続をプールするクラス。
     */
    class Pool extends ParentPool {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters) {
            super(undefined, connectionParameters);
            this.connectorDelegates = [];
            this.maximumNumberOfConnections = Pool.maximumNumberOfConnections;
            this.borrowingStatus = new Int32Array(this.maximumNumberOfConnections);
        }
        async borrowConnectorDelegate() {
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
                return new Promise((resolve, reject) => {
                    const database = new sqlite3.Database(this.connectionParameters.databaseFile.getAbsolutePath(), (error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            this.connectorDelegates[barrowedIndex] = database;
                            resolve(database);
                        }
                    });
                });
            }
            else {
                return new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            const database = await this.borrowConnectorDelegate();
                            resolve(database);
                        }
                        catch (error) {
                            reject(error);
                        }
                    }, 100);
                });
            }
        }
        async releaseConnectorDelegate(connectorDelegate, errorOccurred) {
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
        closeConnectorDelegate(connectorDelegate) {
            return new Promise((resolve, reject) => {
                if (typeof connectorDelegate === "undefined") {
                    resolve();
                }
                else {
                    connectorDelegate.close((error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve();
                        }
                    });
                }
            });
        }
        async end() {
            let throwLater = null;
            for (let index = 0; index < this.maximumNumberOfConnections - 1; index++) {
                const connectorDelegate = this.connectorDelegates[index];
                try {
                    await this.closeConnectorDelegate(connectorDelegate);
                    this.connectorDelegates[index] = undefined;
                }
                catch (error) {
                    throwLater = error;
                }
            }
            if (throwLater !== null) {
                throw throwLater;
            }
        }
        createErrorFromInnerError(error) {
            return new DatabaseError(error.message, error.errno);
        }
    }
    SQLite.Pool = Pool;
    /**
     * SQLiteに接続するクラス。接続する前にコネクションプールを開始する必要がある。
     */
    class Connector extends ParentConnector {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters) {
            super(connectionParameters);
            this._errorOccurred = false;
            this._isTransactionBegun = false;
            this._isolationLevel = null;
        }
        get errorOccurred() {
            return this._errorOccurred;
        }
        async borrowDelegateFromPool() {
            let pool = Pool.get(this.connectionParameters);
            if (typeof pool === "undefined") {
                pool = new Pool(this.connectionParameters);
                Pool.put(this.connectionParameters, pool);
            }
            const delegate = await pool.borrowConnectorDelegate();
            if (Connector.errorMonitoringDelegates.includes(delegate) === false) {
                delegate.addListener("error", () => {
                    this._errorOccurred = true;
                });
                Connector.errorMonitoringDelegates.push(delegate);
            }
            return delegate;
        }
        async releaseDelegateToPool() {
            const pool = Pool.get(this.connectionParameters);
            if (typeof pool !== "undefined" && this.existsDelegate()) {
                pool.releaseConnectorDelegate(this.delegate, this._errorOccurred);
            }
        }
        setStatementTimeoutToDelegate(milliseconds) {
            return new Promise((resolve, reject) => {
                this.delegate.run(StringObject.join(["PRAGMA busy_timeout = ", milliseconds, ";"]).toString(), (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
        createBindParameterFromValue(value) {
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
        executeByDelegate(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.delegate.run(sql, parameters, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        this.fetchNumberOfRecordsLastUpdated().then((count) => {
                            resolve(count);
                        }).catch((error) => {
                            reject(error);
                        });
                    }
                });
            });
        }
        fetchFieldByDelegate(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.delegate.get(sql, parameters, (error, row) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        try {
                            const keys = Object.keys(row);
                            resolve(row[keys[0]]);
                        }
                        catch (error) {
                            reject(new DataNotFoundError());
                        }
                    }
                });
            });
        }
        fetchRecordByDelegate(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.delegate.get(sql, parameters, (error, row) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        if (row) {
                            resolve(row);
                        }
                        else {
                            reject(new DataNotFoundError());
                        }
                    }
                });
            });
        }
        fetchRecordsByDelegate(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.delegate.all(sql, parameters, (error, rows) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(rows);
                    }
                });
            });
        }
        async existsTable(table) {
            let tableName;
            if (table instanceof Table) {
                tableName = table.physicalName;
            }
            else {
                tableName = table;
            }
            const numberOfTables = await this.fetchField("SELECT COUNT(*) FROM sqlite_master WHERE type = ? AND name = ?;", ["table", tableName]);
            return (numberOfTables > 0);
        }
        async fetchColumns(table) {
            let tableName;
            if (table instanceof Table) {
                tableName = table.physicalName;
            }
            else {
                tableName = table;
            }
            const columns = [];
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
        fetchNumberOfRecordsLastUpdated() {
            return this.fetchField("SELECT CHANGES();");
        }
        /**
         * 最後に挿入したレコードのIDを取得する。レコードを挿入したコネクションと同じ接続内で実行する必要がある。
         *
         * @returns
         */
        fetchLastInsertedRecordID() {
            return this.fetchField("SELECT LAST_INSERT_ROWID();");
        }
        async isTransactionBegun() {
            return this._isTransactionBegun;
        }
        /**
         * トランザクションの分離レベル。
         */
        get isolationLevel() {
            return this._isolationLevel;
        }
        /**
         * @param isolationLevel
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        async begin(isolationLevel) {
            this._isolationLevel = isolationLevel;
            const sql = new StringObject("BEGIN ");
            sql.append(isolationLevel);
            sql.append(";");
            await this.execute(sql.upper().toString());
            this._isTransactionBegun = true;
        }
        async rollback() {
            this._isolationLevel = null;
            await this.execute("ROLLBACK;");
            this._isTransactionBegun = false;
        }
        async commit() {
            this._isolationLevel = null;
            await this.execute("COMMIT;");
            this._isTransactionBegun = false;
        }
        createErrorFromInnerError(error) {
            return new DatabaseError(error.message, error.errno);
        }
    }
    Connector.errorMonitoringDelegates = [];
    SQLite.Connector = Connector;
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    class RecordBinder extends ParentRecordBinder {
    }
    SQLite.RecordBinder = RecordBinder;
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    class SingleRecordBinder extends ParentSingleRecordBinder {
    }
    SQLite.SingleRecordBinder = SingleRecordBinder;
})(SQLite || (SQLite = {}));
/**
 * トランザクションの分離レベル列挙型。
 */
export var IsolationLevel;
(function (IsolationLevel) {
    /**
     * 最初のデータベースへのアクセス(SELECTやUPDATEなど)が発生した際にロックが取得されます。
     * SELECTが最初の操作なら共有ロックが取得され、データを読み取ることができますが、書き込みはまだできません。
     * INSERT、UPDATE、DELETEなどの書き込み操作が行われたときに、SQLiteは排他ロックを取得します。
     */
    IsolationLevel["deferred"] = "deferred";
    /**
     * トランザクションの開始時点で即座に予約ロック(後に書き込みをする意図があるロック)が取得されます。
     * 予約ロックは、他のトランザクションがデータベースへの書き込みを行うことを防ぎますが、
     * 他のトランザクションはまだデータの読み取りを行うことができます(共有ロックは許可されます)。
     * トランザクション内で実際にデータの書き込みが発生した場合に、SQLiteは排他ロックにエスカレートします。
     */
    IsolationLevel["immediate"] = "immediate";
    /**
     * トランザクションの開始時に、データベース全体に対する排他ロックが即座に取得されます。
     * このロックにより、他のトランザクションは読み取りも書き込みもできなくなります。
     * トランザクションが終了するまで、他のプロセスやスレッドがデータベースにアクセスできないため、
     * 他のトランザクションを完全にブロックします。
    */
    IsolationLevel["exclusive"] = "exclusive";
})(IsolationLevel || (IsolationLevel = {}));
