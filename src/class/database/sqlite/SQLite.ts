import { Datetime, RecordMap, StringObject, Table } from "scent-typescript";
import File from "../../filesystem/File.js";
import { DataNotFoundError, Database, DatabaseError } from "../Database.js";
import sqlite3 from "sqlite3";

export type ConnectionParameters = {
    databaseFile: File
}

/**
 * SQLiteに接続するクラス。
 */
export default class SQLite extends Database<sqlite3.Database, ConnectionParameters> {

    /**
     * コンストラクタ。接続に使用するパラメーターを指定する。
     * 
     * @param connectionParameters 
     */    
    public constructor(connectionParameters: ConnectionParameters) {
        super(connectionParameters);
    }

    protected createAdapter(connectionParameters: ConnectionParameters): Promise<sqlite3.Database> {
        return new Promise<sqlite3.Database>((resolve, reject) => {
            const database = new sqlite3.Database(connectionParameters.databaseFile.getAbsolutePath(), (error: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(database);
                }
            });
        });
    }

    protected async connectAdapter(adapter: sqlite3.Database): Promise<void> {
        // nop
    }

    protected setStatementTimeoutToAdapter(milliseconds: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.adapter.run(StringObject.join(["PRAGMA busy_timeout = ", milliseconds, ";"]).toString(), (error: any) => {
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

    protected executeByAdapter(sql: string, parameters?: any[]): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.adapter.run(sql, parameters, (error: any) => {
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

    protected fetchFieldByAdapter(sql: string, parameters?: any[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.adapter.get(sql, parameters, (error: any, row: Record<string, any>) => {
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

    protected fetchRecordByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>> {
        return new Promise<Record<string, any>>((resolve, reject) => {
            this.adapter.get(sql, parameters, (error: any, row: Record<string, any>) => {
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

    protected fetchRecordsByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>[]> {
        return new Promise<Record<string, any>[]>((resolve, reject) => {
            this.adapter.all(sql, parameters, (error: any, rows: Record<string, any>[]) => {
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

    public async begin(mode: "deferred" |  "immediate" | "exclusive"): Promise<void> {
        const sql = new StringObject("BEGIN ");
        sql.append(mode);
        sql.append(";");
        await this.execute(sql.upper().toString());
    }
    
    public async rollback(): Promise<void> {
        await this.execute("ROLLBACK;");
    }

    public async commit(): Promise<void> {
        await this.execute("COMMIT;")
    }

    protected closeAdapter(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.adapter === null) {
                resolve();
                return;
            }
            this.adapter.close((error: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    protected createErrorFromInnerError(error: any): DatabaseError {
        return new DatabaseError(error.message, error.errno);
    }
}
