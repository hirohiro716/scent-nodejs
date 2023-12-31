import pg from "pg";
import { DataNotFoundError, Connector as ParentConnector, DatabaseError } from "./Connector.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";

/**
 * PostgreSQLデータベース関連のクラス。
 */
export namespace PostgreSQL {

    type ConnectionParameters = {
        serverAddress: string,
        databaseName: string,
        user: string,
        password: string,
        portNumber?: number,
        connectionTimeoutMilliseconds?: number,
    }
    
    /**
     * PostgreSQLに接続するクラス。接続する前にコネクションプールを開始する必要がある。
     */
    export class Connector extends ParentConnector<pg.Pool, ConnectionParameters> {
        
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         * 
         * @param connectionParameters 
         */
        public constructor(connectionParameters: ConnectionParameters) {
            super(connectionParameters);
        }
    
        private static pools: Map<string, pg.Pool> | null = null;

        private static maximumNumberOfConnections: number = 4;
    
        /**
         * 許容する最大接続数を指定してコネクションプールを開始する。
         * 
         * @param maximumNumberOfConnections 
         */
        public static poolStart(maximumNumberOfConnections: number): void {
            if (this.pools !== null) {
                return;
            }
            this.pools = new Map();
            this.maximumNumberOfConnections = maximumNumberOfConnections;
        }
    
        /**
         * コネクションプールを終了する。
         * 
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public static async poolEnd(): Promise<void> {
            if (this.pools !== null) {
                for (const pool of this.pools.values()) {
                    try {
                        await pool.end();
                    } catch (error: any) {
                        throw new DatabaseError(error.message);
                    }
                }
                this.pools = null;
            }
        }
    
        private _poolClient: pg.PoolClient | null = null;
    
        /**
         * アダプターが生成したデータベースに接続するためのクライアントインスタンス。
         * 
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public get poolClient(): pg.PoolClient {
            if (this._poolClient === null) {
                throw new DatabaseError("Not connected to database.");
            }
            return this._poolClient;
        }
    
        protected async createAdapter(connectionParameters: ConnectionParameters): Promise<pg.Pool> {
            if (Connector.pools === null) {
                throw new DatabaseError("Pool has not been started.");
            } else {
                const jsonOfParameters = JSON.stringify(connectionParameters);
                let pool = Connector.pools.get(jsonOfParameters);
                if (typeof pool === "undefined") {
                    pool = new pg.Pool({
                        host: connectionParameters.serverAddress,
                        database: connectionParameters.databaseName,
                        user: connectionParameters.user,
                        password: connectionParameters.password,
                        port: connectionParameters.portNumber,
                        connectionTimeoutMillis: connectionParameters.connectionTimeoutMilliseconds,
                        max: Connector.maximumNumberOfConnections,
                    });
                    Connector.pools.set(jsonOfParameters, pool);
                }
                return pool;
            }
        }
    
        protected async connectAdapter(adapter: pg.Pool): Promise<void> {
            this._poolClient = await adapter.connect();
        }
    
        protected async setStatementTimeoutToAdapter(milliseconds: number): Promise<void> {
            await this.poolClient.query(StringObject.join(["SET statement_timeout = ", milliseconds, ";"]).toString());
        }
    
        protected createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Date | Buffer {
            if (value instanceof StringObject) {
                return value.toString();
            }
            if (value instanceof Datetime) {
                return value.date;
            }
            return value;
        }
    
        /**
         * 指定されたSQLのプレースホルダー(?)をpgで使用できる$nに修正する。
         * 
         * @param sql 
         * @returns
         */
        private fixPlaceholder(sql: string): string {
            const fixed = new StringObject();
            let parameterNumber = 1;
            let inString = false;
            let couldBeEnd = false;
            for (const one of sql) {
                if (couldBeEnd) {
                    couldBeEnd = false;
                    if (one !== "'") {
                        inString = false;
                    }
                } else {
                    if (one === "'") {
                        if (inString) {
                            couldBeEnd = true;
                        } else {
                            inString = true;
                        }
                    }
                }
                if (inString === false && one === "?") {
                    fixed.append("$").append(parameterNumber);
                    parameterNumber++;
                } else {
                    fixed.append(one);
                }
            }
            return fixed.toString();
        }
    
        protected async executeByAdapter(sql: string, parameters?: any[]): Promise<number> {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            return result.rowCount;
        }
    
        protected async fetchFieldByAdapter(sql: string, parameters?: any[]): Promise<any> {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            try {
                return result.rows[0][result.fields[0].name];
            } catch (error: any) {
                throw new DataNotFoundError();
            }
        }
        
        protected async fetchRecordByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>> {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            if (result.rowCount === 0) {
                throw new DataNotFoundError();
            }
            return result.rows[0];
        }
        
        protected async fetchRecordsByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>[]> {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            return result.rows;
        }
    
        public async existsTable(table: string | Table<any>): Promise<boolean> {
            let tableName: string;
            if (table instanceof Table) {
                tableName = table.physicalName;
            } else {
                tableName = table;
            }
            const numberOfTables: number = await this.fetchField("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?;", [tableName]);
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
            for (const record of await this.fetchRecords("SELECT column_name FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position;", [tableName])) {
                columns.push(record["column_name"]);
            }
            return columns;
        }
    
        /**
         * データベースサーバーの現在の時刻を取得する。
         * 
         * @returns 
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public async fetchNow(): Promise<Datetime> {
            const date: Date = await this.fetchField("SELECT CLOCK_TIMESTAMP();");
            return new Datetime(date);
        }
    
        /**
         * 次のシーケンス値を取得する。
         * 
         * @returns 
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public fetchNextSequenceValue(name: string): Promise<any> {
            return this.fetchField("SELECT NEXTVAL(?);", [name]);
        }
    
        /**
         * テーブルの書き込みをロックする。
         * 
         * @param table 
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public async lockTableAsReadonly(table: string | Table<any>): Promise<void> {
            const sql = new StringObject("LOCK TABLE ");
            if (table instanceof Table) {
                sql.append(table.physicalName);
            } else {
                sql.append(table);
            }
            sql.append(" IN EXCLUSIVE MODE NOWAIT;");
            await this.execute(sql.toString());
        }
    
        /**
         * テーブルの読み取りと書き込みをロックする。
         * 
         * @param table 
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        public async lockTable(table: string | Table<any>): Promise<void> {
            const sql = new StringObject("LOCK TABLE ");
            if (table instanceof Table) {
                sql.append(table.physicalName);
            } else {
                sql.append(table);
            }
            sql.append(" IN ACCESS EXCLUSIVE MODE NOWAIT;");
            await this.execute(sql.toString());
        }
    
        public async begin(): Promise<void> {
            await this.executeByAdapter("BEGIN;");
        }
    
        public async rollback(): Promise<void> {
            await this.executeByAdapter("ROLLBACK;");
        }
    
        public async commit(): Promise<void> {
            await this.executeByAdapter("COMMIT;");
        }
        
        protected async closeAdapter(): Promise<void> {
            if (this._poolClient) {
                this._poolClient.release();
            }
        }
    
        protected createErrorFromInnerError(error: pg.DatabaseError): DatabaseError {
            return new DatabaseError(error.message, error.code);
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
                this.connector.lockTableAsReadonly(this.getTable());
                return await this.connector.fetchRecords(sql.toString());
            }
            sql.append(" WHERE ");
            sql.append(this.whereSet.buildPlaceholderClause());
            sql.append(" ");
            sql.append(orderBy);
            sql.append(" FOR UPDATE NOWAIT;");
            return this.connector.fetchRecords(sql.toString(), this.whereSet.buildParameters());
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
            sql.append(" FOR UPDATE NOWAIT;");
            return await this.connector.fetchRecord(sql.toString(), this.whereSet.buildParameters());
        }
    }
}
