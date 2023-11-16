import { Column, RecordMap, StringObject, Table } from "scent-typescript";
/**
 * データベースに接続するための抽象クラス。
 *
 * @template A データベースに接続するためのアダプターの型。
 * @template P アダプターのデータベース接続に必要なパラメーターの型。
 */
export class Connector {
    /**
     * コンストラクタ。データベース接続アダプターの接続に使用するパラメーターを指定する。
     *
     * @param connectionParameters
     */
    constructor(connectionParameters) {
        this._adapter = null;
        this._statementTimeoutMilliseconds = 0;
        this.connectionParameters = connectionParameters;
    }
    /**
     * データベースに接続するためのアダプターのインスタンス。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    get adapter() {
        if (this._adapter === null) {
            throw new DatabaseError("Not connected to database.");
        }
        return this._adapter;
    }
    /**
     * データベースに接続する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async connect() {
        try {
            this._adapter = await this.createAdapter(this.connectionParameters);
            await this.connectAdapter(this._adapter);
        }
        catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }
    /**
     * ステートメントを実行後に待機する最大時間のミリ秒。
     */
    get statementTimeoutMilliseconds() {
        return this._statementTimeoutMilliseconds;
    }
    set statementTimeoutMilliseconds(milliseconds) {
        this._statementTimeoutMilliseconds = milliseconds;
    }
    /**
     * データベースレコードを変更するSQLを実行する。
     *
     * @param sql プレースホルダーを使用したSQL。
     * @param parameters バインド変数。
     * @returns 更新されたレコード数。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async execute(sql, parameters) {
        try {
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.executeByAdapter(sql, bindParameters);
        }
        catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }
    /**
     * データベースから取得したクエリの結果で、最初の行、最初のフィールドの値を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async fetchField(sql, parameters) {
        try {
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchFieldByAdapter(sql, bindParameters);
        }
        catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }
    /**
     * データベースから取得したクエリの結果で最初の行を取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async fetchRecord(sql, parameters) {
        try {
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchRecordByAdapter(sql, bindParameters);
        }
        catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }
    /**
     * データベースから取得したクエリの結果を全行取得する。
     *
     * @param sql
     * @param parameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async fetchRecords(sql, parameters) {
        try {
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchRecordsByAdapter(sql, bindParameters);
        }
        catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }
    /**
     * データベースに新しいレコードを追加する。
     *
     * @param record 追加するレコード。
     * @param table 対象のテーブル。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async insert(record, table) {
        const sql = new StringObject("INSERT INTO ");
        if (table instanceof Table) {
            sql.append(table.physicalName);
        }
        else {
            sql.append(table);
        }
        sql.append(" (");
        let object = record;
        if (record instanceof RecordMap) {
            object = record.toObject();
        }
        const columns = Object.keys(object);
        for (let index = 0; index < columns.length; index++) {
            if (index > 0) {
                sql.append(", ");
            }
            sql.append(columns[index]);
        }
        const parameters = Object.values(object);
        sql.append(") VALUES (");
        for (let index = 0; index < parameters.length; index++) {
            if (index > 0) {
                sql.append(", ");
            }
            sql.append("?");
        }
        sql.append(");");
        await this.execute(sql.toString(), parameters);
    }
    /**
     * データベースのレコードを更新する。
     *
     * @param record 更新に使用するレコード。
     * @param table 対象のテーブル。
     * @param whereSet 更新対象を見つけるための検索条件。
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async update(record, table, whereSet) {
        const sql = new StringObject("UPDATE ");
        if (table instanceof Table) {
            sql.append(table.physicalName);
        }
        else {
            sql.append(table);
        }
        sql.append(" SET ");
        let object = record;
        if (record instanceof RecordMap) {
            object = record.toObject();
        }
        const columns = Object.keys(object);
        for (let index = 0; index < columns.length; index++) {
            if (index > 0) {
                sql.append(", ");
            }
            sql.append(columns[index]);
            sql.append(" = ?");
        }
        sql.append(" WHERE ");
        sql.append(whereSet.buildPlaceholderClause());
        sql.append(";");
        const parameters = [...Object.values(object), ...whereSet.buildParameters()];
        const result = await this.execute(sql.toString(), parameters);
        if (result === 0) {
            throw new DataNotFoundError();
        }
        return result;
    }
    /**
     * データベース接続を閉じる。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async close() {
        try {
            this.closeAdapter();
        }
        catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }
    /**
     * Mapインスタンスのキーと値の関連付けを利用してSQLのCASE句を作成する。
     * @example
     * const map = new Map<number, string>();
     * map.set(1, "aaa"); map.set(2, "bbb");
     * makeCaseClauseFromMap("col1", map) returns "CASE col1 WHEN 1 THEN 'aaa' WHEN 2 THEN 'bbb' END"
     *
     * @param column
     * @param object
     */
    static makeCaseClauseFromMap(column, map) {
        const result = new StringObject();
        if (column instanceof Column) {
            result.append(column.physicalName);
        }
        else {
            result.append(column);
        }
        if (map.size > 0) {
            result.prepend(" CASE ");
            for (const key of map.keys()) {
                result.append(" WHEN ");
                let wrapper;
                if (typeof key === "string") {
                    wrapper = "'";
                }
                result.append(wrapper);
                result.append(key);
                result.append(wrapper);
                result.append(" THEN '");
                result.append(map.get(key));
                result.append("' ");
            }
            result.append("END");
        }
        return result.toString();
    }
    /**
     * オブジェクトのプロパティ名と値の関連付けを利用してSQLのCASE句を作成する。
     * @example
     * makeCaseClauseFromObject("col1", {"A": "aaa", "B": "bbb"}) returns "CASE col1 WHEN 'A' THEN 'aaa' WHEN 'B' THEN 'bbb' END"
     *
     * @param column
     * @param object
     */
    static makeCaseClauseFromObject(column, object) {
        return this.makeCaseClauseFromMap(column, new Map(Object.entries(object)));
    }
}
/**
 * データベースへの処理に失敗した場合に発生するエラーのクラス。
 */
export class DatabaseError extends Error {
    /**
     * コンストラクタ。エラーメッセージとエラーコードを指定する。
     *
     * @param messages
     * @param code
     */
    constructor(message, code) {
        if (typeof message === "undefined") {
            super("Unknown database error.");
        }
        else {
            super(message);
        }
        this.code = code;
    }
}
/**
 * データが存在しない場合に発生するエラーのクラス。
 */
export class DataNotFoundError extends DatabaseError {
    /**
     * コンストラクタ。
     */
    constructor() {
        super("Data does not exist.");
    }
}
