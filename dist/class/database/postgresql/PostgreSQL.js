// import { Pool, PoolClient, DatabaseError as InnerError } from "pg";
import pg from "pg";
import { DataNotFoundError, Database, DatabaseError } from "../Database.js";
import { Datetime, StringObject, Table } from "scent-typescript";
/**
 * PostgreSQLに接続するクラス。接続する前にコネクションプールを開始する必要がある。
 */
class PostgreSQL extends Database {
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
     * コネクションプールを開始する。
     */
    static poolStart() {
        this.pools = new Map();
    }
    /**
     * コネクションプールを終了する。
     *
     * @returns
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
        }
    }
    /**
     * アダプターが生成したデータベースに接続するためのクライアントインスタンス。
     */
    get poolClient() {
        if (this._poolClient === null) {
            throw new DatabaseError("Not connected to database.");
        }
        return this._poolClient;
    }
    async createAdapter(connectionParameters) {
        if (PostgreSQL.pools === null) {
            throw new DatabaseError("Pool has not been started.");
        }
        else {
            const jsonOfParameters = JSON.stringify(connectionParameters);
            let pool = PostgreSQL.pools.get(jsonOfParameters);
            if (typeof pool === "undefined") {
                pool = new pg.Pool({
                    host: connectionParameters.serverAddress,
                    database: connectionParameters.databaseName,
                    user: connectionParameters.user,
                    password: connectionParameters.password,
                    port: connectionParameters.portNumber,
                    connectionTimeoutMillis: connectionParameters.connectionTimeoutMilliseconds,
                    max: connectionParameters.maximumNumberOfConnections,
                });
                PostgreSQL.pools.set(jsonOfParameters, pool);
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
     */
    async fetchNow() {
        const date = await this.fetchField("SELECT CLOCK_TIMESTAMP();");
        return new Datetime(date);
    }
    /**
     * 次のシーケンス値を取得する。
     *
     * @returns
     */
    fetchNextSequenceValue(name) {
        return this.fetchField("SELECT NEXTVAL(?);", [name]);
    }
    /**
     * テーブルの書き込みをロックする。
     *
     * @param table
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
PostgreSQL.pools = null;
export default PostgreSQL;
