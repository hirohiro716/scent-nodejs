import { Datetime, StringObject, Table } from "scent-typescript";
import { DataNotFoundError, Connector as ParentConnector, DatabaseError } from "./Connector.js";
import sqlite3 from "sqlite3";
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
        async begin(mode) {
            const sql = new StringObject("BEGIN ");
            sql.append(mode);
            sql.append(";");
            await this.execute(sql.upper().toString());
        }
        async rollback() {
            await this.execute("ROLLBACK;");
        }
        async commit() {
            await this.execute("COMMIT;");
        }
        closeAdapter() {
            return new Promise((resolve, reject) => {
                if (this.adapter === null) {
                    resolve();
                    return;
                }
                this.adapter.close((error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
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
})(SQLite || (SQLite = {}));
