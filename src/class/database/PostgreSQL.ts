import pg from "pg";
import { default as ParentConnector } from "./Connector.js";
import { default as ParentPool } from "./Pool.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
import DataNotFoundError from "./DataNotFoundError.js";
import DatabaseError from "./DatabaseError.js";

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
     * PostgreSQLへの接続をプールするクラス。
     */
    export class Pool extends ParentPool<pg.Pool, ConnectionParameters, pg.PoolClient> {

        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         * 
         * @param connectionParameters 
         */
        public constructor(connectionParameters: ConnectionParameters) {
            super(new pg.Pool({
                host: connectionParameters.serverAddress,
                database: connectionParameters.databaseName,
                user: connectionParameters.user,
                password: connectionParameters.password,
                port: connectionParameters.portNumber,
                connectionTimeoutMillis: connectionParameters.connectionTimeoutMilliseconds,
                max: Pool.maximumNumberOfConnections,
            }), connectionParameters);
        }

        public async borrowConnectorDelegate(): Promise<pg.PoolClient> {
            try {
                return await this.delegate.connect();
            } catch (error: any) {
                throw this.createErrorFromInnerError(error);
            }
        }

        public async releaseConnectorDelegate(connectorDelegate: pg.PoolClient, errorOccurred: boolean): Promise<void> {
            try {
                connectorDelegate.release(errorOccurred);
            } catch (error: any) {
                throw this.createErrorFromInnerError(error);
            }
        }

        protected async end(): Promise<void> {
            try {
                await this.delegate.end();
            } catch (error: any) {
                throw this.createErrorFromInnerError(error);
            }
        }

        protected createErrorFromInnerError(error: pg.DatabaseError): DatabaseError {
            return new DatabaseError(error.message, error.code);
        }
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
        public constructor(connectionParameters: ConnectionParameters) {
            super(connectionParameters);
        }
    
        private _errorOccurred: boolean = false;

        public get errorOccurred(): boolean {
            return this._errorOccurred;
        }

        private static readonly errorMonitoringDelegates: pg.PoolClient[] = [];

        protected async borrowDelegateFromPool(): Promise<pg.PoolClient> {
            let pool = Pool.get(this.connectionParameters);
            if (typeof pool === "undefined") {
                pool = new Pool(this.connectionParameters);
                Pool.put(this.connectionParameters, pool);
            }
            const delegate: pg.PoolClient = await pool.borrowConnectorDelegate();
            if (Connector.errorMonitoringDelegates.includes(delegate) === false) {
                delegate.addListener("error", () => {
                    this._errorOccurred = true;
                });
                Connector.errorMonitoringDelegates.push(delegate);
            }
            return delegate;
        }

        protected async releaseDelegateToPool(): Promise<void> {
            const pool = Pool.get(this.connectionParameters);
            if (typeof pool !== "undefined" && this.existsDelegate()) {
                pool.releaseConnectorDelegate(this.delegate, this._errorOccurred);
            }
        }

        protected async setStatementTimeoutToDelegate(milliseconds: number): Promise<void> {
            await this.delegate.query(StringObject.join(["SET statement_timeout TO ", milliseconds, ";"]).toString());
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
    
        protected async executeByDelegate(sql: string, parameters?: any[]): Promise<number> {
            const result = await this.delegate.query(this.fixPlaceholder(sql), parameters);
            let numberOfRecordsLastUpdated = result.rowCount;
            if (numberOfRecordsLastUpdated == null) {
                numberOfRecordsLastUpdated = 0;
            }
            return numberOfRecordsLastUpdated;
        }
    
        protected async fetchFieldByDelegate(sql: string, parameters?: any[]): Promise<any> {
            const result = await this.delegate.query(this.fixPlaceholder(sql), parameters);
            try {
                return result.rows[0][result.fields[0].name];
            } catch (error: any) {
                throw new DataNotFoundError();
            }
        }
        
        protected async fetchRecordByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>> {
            const result = await this.delegate.query(this.fixPlaceholder(sql), parameters);
            if (result.rowCount === 0) {
                throw new DataNotFoundError();
            }
            return result.rows[0];
        }
        
        protected async fetchRecordsByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>[]> {
            const result = await this.delegate.query(this.fixPlaceholder(sql), parameters);
            return result.rows;
        }
    
        public async existsTable(table: string | Table): Promise<boolean> {
            let tableName: string;
            if (table instanceof Table) {
                tableName = table.physicalName;
            } else {
                tableName = table;
            }
            const numberOfTables: number = await this.fetchField("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?;", [tableName]);
            return (numberOfTables > 0);
        }
    
        public async fetchColumns(table: string | Table): Promise<string[]> {
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
        public async lockTableAsReadonly(table: string | Table): Promise<void> {
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
        public async lockTable(table: string | Table): Promise<void> {
            const sql = new StringObject("LOCK TABLE ");
            if (table instanceof Table) {
                sql.append(table.physicalName);
            } else {
                sql.append(table);
            }
            sql.append(" IN ACCESS EXCLUSIVE MODE NOWAIT;");
            await this.execute(sql.toString());
        }

        private _isTransactionBegun: boolean = false;
    
        public async isTransactionBegun(): Promise<boolean> {
            return this._isTransactionBegun;
        }

        public async begin(): Promise<void> {
            await this.executeByDelegate("BEGIN;");
            this._isTransactionBegun = true;
        }

        public async rollback(): Promise<void> {
            await this.executeByDelegate("ROLLBACK;");
            this._isTransactionBegun = false;
        }
    
        public async commit(): Promise<void> {
            await this.executeByDelegate("COMMIT;");
            this._isTransactionBegun = false;
        }

        protected createErrorFromInnerError(error: pg.DatabaseError): DatabaseError {
            return new DatabaseError(error.message, error.code);
        }
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
}
