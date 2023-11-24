import { Column, RecordMap, StringObject, Table } from "scent-typescript";
import { Connector, DatabaseError } from "./Connector.js";
import { WhereSet } from "./WhereSet.js";
import { RecordMapValidationError } from "./RecordMapValidationError.js";

/**
 * データベースのレコードとオブジェクトをバインドするための抽象クラス。
 * 
 * @template C データベースコネクターの型。
 */
export default abstract class RecordBinder<C extends Connector<any, any>> {

    /**
     * コンストラクタ。接続済みデータベースインスタンスを指定する。
     * 
     * @param connector 
     */
    public constructor(connector: C | null) {
        this._connector = connector;
    }

    private _connector: C | null;

    /**
     * 接続に使用するデータベースインスタンス。
     */
    public get connector(): C | null {
        return this._connector;
    }

    public set connector(connector: C) {
        this._connector = connector;
    }

    /**
     * レコードが保存されているテーブルを取得する。
     * 
     * @returns
     */
    public abstract getTable(): Table<any>;

    /**
     * レコードのすべてのカラムを取得する。
     * 
     * @returns 
     */
    public getColumns(): Column[] {
        return Object.values(this.getTable().columns);
    }

    /**
     * 初期値が入力されたレコードを作成する。
     * 
     * @returns
     */
    public abstract createDefaultRecord(): Promise<RecordMap>;

    private _whereSet: WhereSet | null = null;

    /**
     * バインドするレコードを特定するための検索条件。
     */
    public get whereSet(): WhereSet | null {
        return this._whereSet;
    }

    public set whereSet(whereSet: WhereSet) {
        this._whereSet = whereSet;
    }

    private editingRecords: RecordMap[] = [];

    /**
     * バインドされているレコード。
     */
    public get records(): RecordMap[] {
        return this.editingRecords;
    }

    public set records(records: RecordMap[]) {
        this.editingRecords = records;
    }

    /**
     * バインドするレコードの並び順を定義するカラム文字列の配列を取得する。
     * @example
     * recordBinder.getOrderByColumnsForEdit() returns ["column_name1", "column_name2 ASC", "column_name3 DESC"]
     * 
     * @returns
     */
    protected abstract getOrderByColumnsForEdit(): string[];
    
    /**
     * バインドするレコードを排他制御を行ってから取得する。
     * 
     * @param orderByColumnsForEdit 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract fetchRecordsForEdit(orderByColumnsForEdit: string[]): Promise<Record<string, any>[]>;

    /**
     * データベースのレコードをこのインスタンスにバインドする。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async edit(): Promise<void> {
        const editingRecords: RecordMap[] = [];
        for (const record of await this.fetchRecordsForEdit(this.getOrderByColumnsForEdit())) {
            editingRecords.push(this.getTable().createRecord(record));
        }
        this.editingRecords = editingRecords;
    }

    /**
     * 変更するレコードを特定するための検索条件が未指定の場合でも、更新を許可している場合はtrueを返す。
     * 
     * @returns
     */
    protected abstract isPermittedUpdateWhenEmptySearchCondition(): boolean;

    /**
     * このインスタンスにバインドされているレコードでデータベースのレコードを上書きする。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async update(): Promise<void> {
        if (this._connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        const sql = new StringObject("DELETE FROM ");
        sql.append(this.getTable().physicalName);
        if (this._whereSet === null) {
            if (this.isPermittedUpdateWhenEmptySearchCondition() === false) {
                throw new DatabaseError("Search condition for updating is missing.");
            }
            sql.append(";");
            await this._connector.execute(sql.toString());
        } else {
            sql.append(" WHERE ");
            sql.append(this._whereSet.buildPlaceholderClause());
            sql.append(";");
            await this._connector.execute(sql.toString(), this._whereSet.buildParameters());
        }
        for (const record of this.editingRecords) {
            await this._connector.insert(record, this.getTable());
        }
    }

    /**
     * バインドするレコードを特定するための検索条件に該当するレコードが、データベースに存在する場合はtrueを返す。
     * 
     * @returns 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async exists(): Promise<boolean> {
        if (this._connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        if (this._whereSet === null) {
            throw new DatabaseError("Search condition for identification is missing.");
        }
        const sql = new StringObject("SELECT (*) FROM ");
        sql.append(this.getTable().physicalName);
        sql.append(" WHERE ");
        sql.append(this._whereSet.buildPlaceholderClause());
        sql.append(";");
        const numberOfRecords: number = await this._connector.fetchField(sql.toString(), this._whereSet.buildParameters());
        return (numberOfRecords > 0);
    }

    /**
     * 指定されたレコードとカラムに対応する値の妥当性を確認する。
     * 
     * @throws Error
     */
    public abstract valueValidate(record: RecordMap, column: Column): Promise<void>;

    /**
     * バインドされているレコードが有効か検証する。
     */
    public async validate(): Promise<void> {
        for (const record of this.records) {
            const errors: Map<Column, string> = new Map();
            for (const column of this.getColumns()) {
                try {
                    await this.valueValidate(record, column);
                } catch (error: any) {
                    errors.set(column, error.message);
                }
            }
            if (errors.size > 0) {
                throw new RecordMapValidationError(record, errors);
            }
        }
    }

    /**
     * 指定されたレコードとカラムに対応する値を標準化して返す。undefinedを返す場合は値に対して何もしない。
     * 
     * @returns
     */
    public abstract valueNormalize(record: RecordMap, column: Column): Promise<any>;

    /**
     * バインドされているレコードの値を標準化する。
     */
    public async normalize(): Promise<void> {
        for (const record of this.records) {
            for (const column of this.getColumns()) {
                const value = await this.valueNormalize(record, column);
                if (typeof value !== "undefined") {
                    record.set(column, value);
                }
            }
        }
    }
}
