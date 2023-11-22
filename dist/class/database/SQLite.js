import sqlite3 from "sqlite3";
import { DataNotFoundError, Connector as ParentConnector, DatabaseError } from "./Connector.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
/**
 * SQLiteデータベース関連のクラス。
 */
export var SQLite;
(function (SQLite) {
    /**
     * SQLiteに接続するクラス。
     */
    class Connector extends ParentConnector {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters) {
            super(connectionParameters);
            this._isolationLevel = null;
        }
        createAdapter(connectionParameters) {
            return new Promise((resolve, reject) => {
                const database = new sqlite3.Database(connectionParameters.databaseFile.getAbsolutePath(), (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(database);
                    }
                });
            });
        }
        async connectAdapter(adapter) {
            // nop
        }
        setStatementTimeoutToAdapter(milliseconds) {
            return new Promise((resolve, reject) => {
                this.adapter.run(StringObject.join(["PRAGMA busy_timeout = ", milliseconds, ";"]).toString(), (error) => {
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
        executeByAdapter(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.adapter.run(sql, parameters, (error) => {
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
        fetchFieldByAdapter(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.adapter.get(sql, parameters, (error, row) => {
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
        fetchRecordByAdapter(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.adapter.get(sql, parameters, (error, row) => {
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
        fetchRecordsByAdapter(sql, parameters) {
            return new Promise((resolve, reject) => {
                this.adapter.all(sql, parameters, (error, rows) => {
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
        }
        async rollback() {
            this._isolationLevel = null;
            await this.execute("ROLLBACK;");
        }
        async commit() {
            this._isolationLevel = null;
            await this.execute("COMMIT;");
        }
        closeAdapter() {
            return new Promise((resolve, reject) => {
                if (this.adapter === null) {
                    this._isolationLevel = null;
                    resolve();
                    return;
                }
                this.adapter.close((error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        this._isolationLevel = null;
                        resolve();
                    }
                });
            });
        }
        createErrorFromInnerError(error) {
            return new DatabaseError(error.message, error.errno);
        }
    }
    SQLite.Connector = Connector;
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    class RecordBinder extends ParentRecordBinder {
        constructor() {
            super(...arguments);
            this.isEditing = false;
        }
        async fetchRecordsForEdit(orderByColumnsForEdit) {
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
        // TODO: editByConnector
        async edit() {
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
            }
            finally {
                try {
                    await connector.close();
                }
                catch (error) {
                    // nop
                }
            }
        }
        /**
         * バインドされているレコードを破棄して編集終了処理を実行する。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        async close() {
            if (this.isEditing) {
                const connector = this.createConnectorForEditing();
                try {
                    await connector.connect();
                    await this.updateToEditingFinish(connector);
                }
                finally {
                    await connector.close();
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
        async forciblyClose() {
            const connector = this.createConnectorForEditing();
            try {
                await connector.connect();
                await this.updateToEditingFinish(connector);
            }
            finally {
                await connector.close();
            }
            this.records = [];
        }
    }
    SQLite.RecordBinder = RecordBinder;
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    class SingleRecordBinder extends ParentSingleRecordBinder {
        constructor() {
            super(...arguments);
            this.isEditing = false;
        }
        async fetchRecordForEdit() {
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
        async edit() {
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
            }
            finally {
                try {
                    await connector.close();
                }
                catch (error) {
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
        async editByConnector(connector) {
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
        async close() {
            if (this.isEditing) {
                const connector = this.createConnectorForEditing();
                try {
                    await connector.connect();
                    await this.updateToEditingFinish(connector);
                }
                finally {
                    await connector.close();
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
        async closeByConnector(connector) {
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
        async forciblyClose() {
            const connector = this.createConnectorForEditing();
            try {
                await connector.connect();
                await this.updateToEditingFinish(connector);
                this.isEditing = false;
            }
            finally {
                await connector.close();
            }
            this.record = this.getTable().createRecord();
        }
        /**
         * 指定されたコネクターを使用してバインドしようとしているレコードの編集中を強制的に解除するメソッド。
         *
         * @param connector 接続済みのコネクター。
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        async forciblyCloseByConnector(connector) {
            await this.updateToEditingFinish(connector);
            this.isEditing = false;
            this.record = this.getTable().createRecord();
        }
    }
    SQLite.SingleRecordBinder = SingleRecordBinder;
})(SQLite || (SQLite = {}));
