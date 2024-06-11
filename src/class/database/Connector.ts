import { Column, Datetime, RecordMap, StringObject, Table } from "scent-typescript";
import { WhereSet } from "./WhereSet.js";
import DatabaseError from "./DatabaseError.js";
import DataNotFoundError from "./DataNotFoundError.js";

/**
 * データベースに接続するための抽象クラス。
 * 
 * @template D デリゲートの型。
 * @template C データベースに接続するためのパラメーターの型。
 */
export default abstract class Connector<D, C> {

    /**
     * コンストラクタ。データベース接続に使用するパラメーターを指定する。
     * 
     * @param connectionParameters 
     */
    protected constructor(connectionParameters: C) {
        this.connectionParameters = connectionParameters;
    }

    /**
     * データベース接続デリゲートの接続に使用するパラメーター。
     */
    protected readonly connectionParameters: C;

    private _delegate: D | null = null;

    /**
     * デリゲートのインスタンスが存在する場合はtrueを返す。
     * 
     * @returns 
     */
    public existsDelegate(): boolean {
        return this._delegate !== null;
    }

    /**
     * デリゲートのインスタンス。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public get delegate(): D {
        if (this._delegate === null) {
            throw new DatabaseError("Not connected to database.");
        }
        return this._delegate;
    }

    /**
     * データベースへの接続でエラーが発生している場合はtrue。
     */
    public abstract get errorOccurred(): boolean;

    /**
     * 接続プールからデリゲートインスタンスを借りる。
     * 
     * @param pool 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract borrowDelegateFromPool(): Promise<D>;

    /**
     * データベースに接続する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async connect(): Promise<void> {
        await this.releaseDelegateToPool();
        this._delegate = await this.borrowDelegateFromPool();
    }

    /**
     * デリゲートインスタンスを接続プールに解放する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract releaseDelegateToPool(): Promise<void>;

    /**
     * データベース接続を解放する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async release(): Promise<void> {
        try {
            if (await this.isTransactionBegun()) {
                await this.rollback();
            }
        } catch (error: any) {
        }
        try {
            await this.releaseDelegateToPool();
        } catch (error: any) {
            if (this.errorOccurred) {
                return;
            }
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

    private _statementTimeoutMilliseconds: number = 0;

    /**
     * ステートメントを実行後に待機する最大時間のミリ秒。
     */
    public get statementTimeoutMilliseconds(): number {
        return this._statementTimeoutMilliseconds;
    }

    public set statementTimeoutMilliseconds(milliseconds: number) {
        this._statementTimeoutMilliseconds = milliseconds;
    }

    /**
     * デリゲートにステートメントを実行後に待機する最大時間のミリ秒をセットする。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract setStatementTimeoutToDelegate(milliseconds: number): Promise<void>;

    /**
     * 指定された値からプレースホルダーに使用できるバインド変数を作成する。
     * 
     * @param value 
     * @returns
     */
    protected abstract createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Date | Buffer;

    /**
     * デリゲートを使ってデータベースレコードを変更するSQLを実行する。
     * 
     * @param sql プレースホルダーを使用したSQL。
     * @param parameters バインド変数。
     * @returns 更新されたレコード数。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract executeByDelegate(sql: string, parameters?: any[]): Promise<number>;

    /**
     * データベースレコードを変更するSQLを実行する。
     * 
     * @param sql プレースホルダーを使用したSQL。
     * @param parameters バインド変数。
     * @returns 更新されたレコード数。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async execute(sql: string, parameters?: any[]): Promise<number> {
        try {
            await this.setStatementTimeoutToDelegate(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.executeByDelegate(sql, bindParameters);
        } catch (error: any) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

    /**
     * データベースからデリゲートを使って取得したクエリの結果で、最初の行、最初のフィールドの値を取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchFieldByDelegate(sql: string, parameters?: any[]): Promise<any>;

    /**
     * データベースから取得したクエリの結果で、最初の行、最初のフィールドの値を取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async fetchField(sql: string, parameters?: any[]): Promise<any> {
        try {
            await this.setStatementTimeoutToDelegate(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchFieldByDelegate(sql, bindParameters);
        } catch (error: any) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

    /**
     * データベースからデリゲートを使って取得したクエリの結果で最初の行を取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>>;

    /**
     * データベースから取得したクエリの結果で最初の行を取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async fetchRecord(sql: string, parameters?: any[]): Promise<Record<string, any>> {
        try {
            await this.setStatementTimeoutToDelegate(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchRecordByDelegate(sql, bindParameters);
        } catch (error: any) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

    /**
     * データベースからデリゲートを使って取得したクエリの結果を全行取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordsByDelegate(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;

    /**
     * データベースから取得したクエリの結果を全行取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async fetchRecords(sql: string, parameters?: any[]): Promise<Record<string, any>[]> {
        try {
            await this.setStatementTimeoutToDelegate(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchRecordsByDelegate(sql, bindParameters);
        } catch (error: any) {
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
    public async insert(record: Record<string, any> | RecordMap, table: string | Table<any>): Promise<void> {
        const sql = new StringObject("INSERT INTO ");
        if (table instanceof Table) {
            sql.append(table.physicalName);
        } else {
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
    public async update(record: Record<string, any> | RecordMap, table: string | Table<any>, whereSet: WhereSet): Promise<number> {
        const sql = new StringObject("UPDATE ");
        if (table instanceof Table) {
            sql.append(table.physicalName);
        } else {
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
     * 指定されたテーブルが存在する場合はtrueを返す。
     * 
     * @param table 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract existsTable(table: string | Table<any>): Promise<boolean>;

    /**
     * 指定されたテーブルのすべてのカラムを取得する。
     * 
     * @param table 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract fetchColumns(table: string | Table<any>): Promise<string[]>;

    /**
     * トランザクションが開始されている場合はtrueを返す。
     * 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract isTransactionBegun(): Promise<boolean>;

    /**
     * トランザクションブロックを初期化する。以降の更新は全て明示的なコミットもしくはロールバックされるまで、単一のトランザクションの中で実行される。
     * 
     * @param option 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract begin(option?: any): Promise<void>;

    /**
     * 現在のトランザクションをロールバックする。そのトランザクションで行われた全ての変更が廃棄される。 
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract rollback(): Promise<void>;

    /**
     * 現在のトランザクションをコミットする。 そのトランザクションで行われた全ての変更が確定される。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract commit(): Promise<void>;

    /**
     * それぞれのデータベース内部のエラーを元にDatabaseErrorを作成する。
     * 
     * @param error 
     * @returns
     */
    protected abstract createErrorFromInnerError(error: any): DatabaseError;

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
    public static makeCaseClauseFromMap(column: Column | string, map: Map<number | string, string>): string {
        const result = new StringObject();
        if (column instanceof Column) {
            result.append(column.physicalName);
        } else {
            result.append(column);
        }
        if (map.size > 0) {
            result.prepend(" CASE ");
            for (const key of map.keys()) {
                result.append(" WHEN ");
                let wrapper: string | undefined;
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
    public static makeCaseClauseFromObject(column: Column | string, object: Record<string, string>): string {
        return this.makeCaseClauseFromMap(column, new Map<string, string>(Object.entries(object)));
    }
}
