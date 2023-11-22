import pg from "pg";
import { DataNotFoundError, Connector as ParentConnector, DatabaseError } from "./Connector.js";
import { Datetime, StringObject, Table } from "scent-typescript";
import ParentRecordBinder from "./RecordBinder.js";
import ParentSingleRecordBinder from "./SingleRecordBinder.js";
/**
 * PostgreSQLデータベース関連のクラス。
 */
export var PostgreSQL;
(function (PostgreSQL) {
    /**
     * PostgreSQLに接続するクラス。接続する前にコネクションプールを開始する必要がある。
     */
    class Connector extends ParentConnector {
        /**
         * コンストラクタ。接続に使用するパラメーターを指定する。
         *
         * @param connectionParameters
         */
        constructor(connectionParameters) {
            super(connectionParameters);
            this._poolClient = null;
        }
        /**
         * 許容する最大接続数を指定してコネクションプールを開始する。
         *
         * @param maximumNumberOfConnections
         */
        static poolStart(maximumNumberOfConnections) {
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
        static async poolEnd() {
            if (this.pools !== null) {
                for (const pool of this.pools.values()) {
                    try {
                        await pool.end();
                    }
                    catch (error) {
                        throw new DatabaseError(error.message);
                    }
                }
                this.pools = null;
            }
        }
        /**
         * アダプターが生成したデータベースに接続するためのクライアントインスタンス。
         *
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        get poolClient() {
            if (this._poolClient === null) {
                throw new DatabaseError("Not connected to database.");
            }
            return this._poolClient;
        }
        async createAdapter(connectionParameters) {
            if (Connector.pools === null) {
                throw new DatabaseError("Pool has not been started.");
            }
            else {
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
        async connectAdapter(adapter) {
            this._poolClient = await adapter.connect();
        }
        async setStatementTimeoutToAdapter(milliseconds) {
            await this.poolClient.query(StringObject.join(["SET statement_timeout = ", milliseconds, ";"]).toString());
        }
        createBindParameterFromValue(value) {
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
        fixPlaceholder(sql) {
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
                }
                else {
                    if (one === "'") {
                        if (inString) {
                            couldBeEnd = true;
                        }
                        else {
                            inString = true;
                        }
                    }
                }
                if (inString === false && one === "?") {
                    fixed.append("$").append(parameterNumber);
                    parameterNumber++;
                }
                else {
                    fixed.append(one);
                }
            }
            return fixed.toString();
        }
        async executeByAdapter(sql, parameters) {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            return result.rowCount;
        }
        async fetchFieldByAdapter(sql, parameters) {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            try {
                return result.rows[0][result.fields[0].name];
            }
            catch (error) {
                throw new DataNotFoundError();
            }
        }
        async fetchRecordByAdapter(sql, parameters) {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            if (result.rowCount === 0) {
                throw new DataNotFoundError();
            }
            return result.rows[0];
        }
        async fetchRecordsByAdapter(sql, parameters) {
            const result = await this.poolClient.query(this.fixPlaceholder(sql), parameters);
            return result.rows;
        }
        async existsTable(table) {
            let tableName;
            if (table instanceof Table) {
                tableName = table.physicalName;
            }
            else {
                tableName = table;
            }
            const numberOfTables = await this.fetchField("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?;", [tableName]);
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
        async fetchNow() {
            const date = await this.fetchField("SELECT CLOCK_TIMESTAMP();");
            return new Datetime(date);
        }
        /**
         * 次のシーケンス値を取得する。
         *
         * @returns
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        fetchNextSequenceValue(name) {
            return this.fetchField("SELECT NEXTVAL(?);", [name]);
        }
        /**
         * テーブルの書き込みをロックする。
         *
         * @param table
         * @throws DatabaseError データベースの処理に失敗した場合。
         */
        async lockTableAsReadonly(table) {
            const sql = new StringObject("LOCK TABLE ");
            if (table instanceof Table) {
                sql.append(table.physicalName);
            }
            else {
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
        async lockTable(table) {
            const sql = new StringObject("LOCK TABLE ");
            if (table instanceof Table) {
                sql.append(table.physicalName);
            }
            else {
                sql.append(table);
            }
            sql.append(" IN ACCESS EXCLUSIVE MODE NOWAIT;");
            await this.execute(sql.toString());
        }
        async begin() {
            await this.executeByAdapter("BEGIN;");
        }
        async rollback() {
            await this.executeByAdapter("ROLLBACK;");
        }
        async commit() {
            await this.executeByAdapter("COMMIT;");
        }
        async closeAdapter() {
            if (this._poolClient) {
                this._poolClient.release();
            }
        }
        createErrorFromInnerError(error) {
            return new DatabaseError(error.message, error.code);
        }
    }
    Connector.pools = null;
    Connector.maximumNumberOfConnections = 4;
    PostgreSQL.Connector = Connector;
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    class RecordBinder extends ParentRecordBinder {
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
    PostgreSQL.RecordBinder = RecordBinder;
    /**
     * データベースのレコードとオブジェクトをバインドするための抽象クラス。
     */
    class SingleRecordBinder extends ParentSingleRecordBinder {
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
            sql.append(" FOR UPDATE NOWAIT;");
            return await this.connector.fetchRecord(sql.toString(), this.whereSet.buildParameters());
        }
    }
    PostgreSQL.SingleRecordBinder = SingleRecordBinder;
})(PostgreSQL || (PostgreSQL = {}));
