import { Column, Datetime, RecordMap, StringObject, Table } from "scent-typescript";
import { WhereSet } from "./WhereSet.js";

/**
 * データベースに接続するための抽象クラス。
 * 
 * @template A データベースに接続するためのアダプターの型。
 * @template P アダプターのデータベース接続に必要なパラメーターの型。
 */
export abstract class Database<A, P> {

    /**
     * コンストラクタ。データベース接続アダプターの接続に使用するパラメーターを指定する。
     * 
     * @param connectionParameters 
     */
    protected constructor(connectionParameters: P) {
        this.connectionParameters = connectionParameters;
    }

    /**
     * データベース接続アダプターの接続に使用するパラメーター。
     */
    protected readonly connectionParameters: P;

    private _adapter: A | null = null;

    /**
     * データベースに接続するためのアダプターのインスタンス。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public get adapter(): A {
        if (this._adapter === null) {
            throw new DatabaseError("Not connected to database.");
        }
        return this._adapter;
    }

    /**
     * データベースに接続するためのアダプターを作成する。
     * 
     * @param connectionParameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract createAdapter(connectionParameters: P): Promise<A>;

    /**
     * アダプターをデータベースに接続する。
     * 
     * @param adapter 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract connectAdapter(adapter: A): Promise<void>;

    /**
     * データベースに接続する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async connect(): Promise<void> {
        try {
            this._adapter = await this.createAdapter(this.connectionParameters);
            await this.connectAdapter(this._adapter);
        } catch (error: any) {
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
     * アダプターにステートメントを実行後に待機する最大時間のミリ秒をセットする。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract setStatementTimeoutToAdapter(milliseconds: number): Promise<void>;

    /**
     * 指定された値からプレースホルダーに使用できるバインド変数を作成する。
     * 
     * @param value 
     * @returns
     */
    protected abstract createBindParameterFromValue(value: string | StringObject | number | boolean | Date | Datetime | Buffer): string | number | boolean | Date | Buffer;

    /**
     * アダプターを使用してデータベースレコードを変更するSQLを実行する。
     * 
     * @param sql プレースホルダーを使用したSQL。
     * @param parameters バインド変数。
     * @returns 更新されたレコード数。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract executeByAdapter(sql: string, parameters?: any[]): Promise<number>;

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
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.executeByAdapter(sql, bindParameters);
        } catch (error: any) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

    /**
     * アダプターを使用して取得したクエリの結果で、最初の行、最初のフィールドの値を取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchFieldByAdapter(sql: string, parameters?: any[]): Promise<any>;

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
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchFieldByAdapter(sql, bindParameters);
        } catch (error: any) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

    /**
     * アダプターを使用して取得したクエリの結果で最初の行を取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>>;

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
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchRecordByAdapter(sql, bindParameters);
        } catch (error: any) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

    /**
     * アダプターを使用して取得したクエリの結果を全行取得する。
     * 
     * @param sql 
     * @param parameters 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordsByAdapter(sql: string, parameters?: any[]): Promise<Record<string, any>[]>;

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
            await this.setStatementTimeoutToAdapter(this._statementTimeoutMilliseconds);
            const bindParameters = [];
            if (parameters) {
                for (const value of parameters) {
                    bindParameters.push(this.createBindParameterFromValue(value));
                }
            }
            return await this.fetchRecordsByAdapter(sql, bindParameters);
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
     * アダプターをデータベースから切断する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract closeAdapter(): Promise<void>;

    /**
     * データベース接続を閉じる。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async close(): Promise<void> {
        try {
            this.closeAdapter();
        } catch (error: any) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw this.createErrorFromInnerError(error);
        }
    }

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
    public constructor(message?: string, code?: string) {
        if (typeof message === "undefined") {
            super("Unknown database error.");
        } else {
            super(message);
        }
        this.code = code;
    }

    /**
     * エラーコード。
     */
    public readonly code: string | undefined;
}

/**
 * データが存在しない場合に発生するエラーのクラス。
 */
export class DataNotFoundError extends DatabaseError {

    /**
     * コンストラクタ。
     */
    public constructor() {
        super("Data does not exist.");
    }
}
