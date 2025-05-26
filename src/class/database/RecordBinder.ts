import Connector from "./Connector.js";
import { Column, RecordMap, StringObject, Table, WhereSet } from "scent-typescript";
import RecordMapValidationError from "./RecordMapValidationError.js";
import DatabaseError from "./DatabaseError.js";
import RecordConflictError from "./RecordConflictError.js";

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
    public get connector(): C {
        if (this._connector == null) {
            throw new Error("The connector is null.");
        }
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
     * 指定されたレコードの識別子を取得する。
     * 
     * @param record 
     * @returns
     */
    public abstract getIdentifier(record: RecordMap): string;

    /**
     * 指定されたレコードの最終更新日時を取得する。更新日時の概念が無い場合はnullを返す。
     * 
     * @param record 
     * @returns
     */
    protected abstract getLastUpdateTime(record: RecordMap): Date | null;

    /**
     * バインドするレコードの並び順を定義するカラム文字列の配列を取得する。
     * @example
     * recordBinder.getOrderByColumnsForEdit() returns ["column_name1", "column_name2 ASC", "column_name3 DESC"]
     * 
     * @returns
     */
    protected abstract getOrderByColumnsForEdit(): string[];

    private _preEditRecords: RecordMap[] | null = null;

    /**
     * 編集開始時のデータベースレコードのクローン。コンフリクトの検出に使用される。
     * 
     * @returns 
     */
    public get preEditRecords(): RecordMap[] | null {
        return this._preEditRecords;
    }

    public set preEditRecords(preEditRecords: RecordMap[]) {
        this._preEditRecords = preEditRecords;
    }

    /**
     * 編集するためのレコードを取得する。
     * 
     * @returns 
     * @throws DatabaseError
     */
    private async fetchRecordsForEdit(): Promise<RecordMap[]> {
        const records: RecordMap[] = [];
        if (this.connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        const orderBy = new StringObject();
        const orderByColumnsForEdit = this.getOrderByColumnsForEdit();
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
            for (const record of await this.connector.fetchRecords(sql.toString())) {
                records.push(this.getTable().createRecord(record));
            }
        } else {
            sql.append(" WHERE ");
            sql.append(this.whereSet.buildPlaceholderClause());
            sql.append(" ");
            sql.append(orderBy);
            sql.append(";");
            for (const record of await this.connector.fetchRecords(sql.toString(), this.whereSet.buildParameters())) {
                records.push(this.getTable().createRecord(record));
            }
        }
        return records;
    }

    /**
     * データベースのレコードを編集してこのインスタンスにバインドする。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async edit(): Promise<void> {
        const editingRecords = await this.fetchRecordsForEdit();
        this._preEditRecords = [];
        for (const record of editingRecords) {
            this._preEditRecords.push(record.clone());
        }
        this.editingRecords = editingRecords;
    }

    private _isConflictIgnored: boolean = false;

    /**
     * 変更するレコードを特定するための検索条件が未指定の場合でも、更新を許可している場合はtrueを返す。
     * 
     * @returns
     */
    protected abstract isPermittedUpdateWhenEmptySearchCondition(): boolean;

    /**
     * コンフリクトを無視する場合はtrue。
     */
    public get isConflictIgnored(): boolean {
        return this._isConflictIgnored;
    }

    public set isConflictIgnored(isConflictIgnored: boolean) {
        this._isConflictIgnored = isConflictIgnored;
    }

    /**
     * コンフリクトを検出する。
     * 
     * @throws RecordConflictError データベースレコードがコンフリクトした場合。
     */
    protected async detectConflict(): Promise<void> {
        if (this._isConflictIgnored === false) {
            if (this._preEditRecords === null) {
                throw new DatabaseError("No pre-edit record has been set.");
            }
            const mapOfIdentifierAndPreEditRecord = new Map<string, RecordMap>();
            for (const preEditRecord of this._preEditRecords) {
                mapOfIdentifierAndPreEditRecord.set(this.getIdentifier(preEditRecord), preEditRecord);
            }
            const conflictRecords: RecordMap[] = [];
            const mapOfIdentifierAndCurrentDatabaseRecord = new Map<string, RecordMap>();
            for (const currentDatabaseRecord of await this.fetchRecordsForEdit()) {
                const identifier = this.getIdentifier(currentDatabaseRecord);
                if (mapOfIdentifierAndPreEditRecord.has(identifier)) {
                    mapOfIdentifierAndCurrentDatabaseRecord.set(identifier, currentDatabaseRecord);
                } else {
                    conflictRecords.push(currentDatabaseRecord);
                }
            }
            const deletedRecords: RecordMap[] = [];
            for (const preEditRecord of this._preEditRecords) {
                const identifier = this.getIdentifier(preEditRecord);
                const currentDatabaseRecord = mapOfIdentifierAndCurrentDatabaseRecord.get(identifier);
                if (typeof currentDatabaseRecord !== "undefined") {
                    const preEditRecordUpdateTime = this.getLastUpdateTime(preEditRecord);
                    const currentDatabaseRecordUpdateTime = this.getLastUpdateTime(currentDatabaseRecord);
                    if (preEditRecordUpdateTime !== null && currentDatabaseRecordUpdateTime !== null && preEditRecordUpdateTime.getTime() < currentDatabaseRecordUpdateTime.getTime()) {
                        conflictRecords.push(currentDatabaseRecord);
                    }
                } else {
                    deletedRecords.push(preEditRecord);
                }
            }
            if (conflictRecords.length > 0) {
                throw new RecordConflictError(conflictRecords);
            }
            if (deletedRecords.length > 0) {
                const mapOfIdentifierAndRecord = new Map<string, RecordMap>();
                for (const record of this.records) {
                    const identifier = this.getIdentifier(record);
                    mapOfIdentifierAndRecord.set(identifier, record);
                }
                for (const deletedRecord of deletedRecords) {
                    const identifier = this.getIdentifier(deletedRecord);
                    if (mapOfIdentifierAndRecord.has(identifier)) {
                        throw new RecordConflictError("編集中のレコードが削除され競合が発生しました。", deletedRecords);
                    }
                }
            }
        }
    }

    /**
     * このインスタンスにバインドされているレコードでデータベースのレコードを上書きする。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     * @throws RecordConflictError データベースレコードがコンフリクトした場合。
     */
    public async update(): Promise<void> {
        if (this._connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        if (await this._connector.isTransactionBegun() === false) {
            throw new DatabaseError(Connector.TRANSACTION_NOT_STARTED_MESSAGE);
        }
        await this.detectConflict();
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
        const sql = new StringObject("SELECT COUNT(*) FROM ");
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
     * 
     * @throws RecordMapValidationError 検証に失敗した場合。
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
     * @throws Error
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
