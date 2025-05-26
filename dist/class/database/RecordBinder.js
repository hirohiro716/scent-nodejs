import Connector from "./Connector.js";
import { StringObject } from "scent-typescript";
import RecordMapValidationError from "./RecordMapValidationError.js";
import DatabaseError from "./DatabaseError.js";
import RecordConflictError from "./RecordConflictError.js";
/**
 * データベースのレコードとオブジェクトをバインドするための抽象クラス。
 *
 * @template C データベースコネクターの型。
 */
export default class RecordBinder {
    /**
     * コンストラクタ。接続済みデータベースインスタンスを指定する。
     *
     * @param connector
     */
    constructor(connector) {
        this._whereSet = null;
        this.editingRecords = [];
        this._preEditRecords = null;
        this._isConflictIgnored = false;
        this._connector = connector;
    }
    /**
     * 接続に使用するデータベースインスタンス。
     */
    get connector() {
        if (this._connector == null) {
            throw new Error("The connector is null.");
        }
        return this._connector;
    }
    set connector(connector) {
        this._connector = connector;
    }
    /**
     * レコードのすべてのカラムを取得する。
     *
     * @returns
     */
    getColumns() {
        return Object.values(this.getTable().columns);
    }
    /**
     * バインドするレコードを特定するための検索条件。
     */
    get whereSet() {
        return this._whereSet;
    }
    set whereSet(whereSet) {
        this._whereSet = whereSet;
    }
    /**
     * バインドされているレコード。
     */
    get records() {
        return this.editingRecords;
    }
    set records(records) {
        this.editingRecords = records;
    }
    /**
     * 編集開始時のデータベースレコードのクローン。コンフリクトの検出に使用される。
     *
     * @returns
     */
    get preEditRecords() {
        return this._preEditRecords;
    }
    set preEditRecords(preEditRecords) {
        this._preEditRecords = preEditRecords;
    }
    /**
     * 編集するためのレコードを取得する。
     *
     * @returns
     * @throws DatabaseError
     */
    async fetchRecordsForEdit() {
        const records = [];
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
        }
        else {
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
    async edit() {
        const editingRecords = await this.fetchRecordsForEdit();
        this._preEditRecords = [];
        for (const record of editingRecords) {
            this._preEditRecords.push(record.clone());
        }
        this.editingRecords = editingRecords;
    }
    /**
     * コンフリクトを無視する場合はtrue。
     */
    get isConflictIgnored() {
        return this._isConflictIgnored;
    }
    set isConflictIgnored(isConflictIgnored) {
        this._isConflictIgnored = isConflictIgnored;
    }
    /**
     * コンフリクトを検出する。
     *
     * @throws RecordConflictError データベースレコードがコンフリクトした場合。
     */
    async detectConflict() {
        if (this._isConflictIgnored === false) {
            if (this._preEditRecords === null) {
                throw new DatabaseError("No pre-edit record has been set.");
            }
            const mapOfIdentifierAndPreEditRecord = new Map();
            for (const preEditRecord of this._preEditRecords) {
                mapOfIdentifierAndPreEditRecord.set(this.getIdentifier(preEditRecord), preEditRecord);
            }
            const conflictRecords = [];
            const mapOfIdentifierAndCurrentDatabaseRecord = new Map();
            for (const currentDatabaseRecord of await this.fetchRecordsForEdit()) {
                const identifier = this.getIdentifier(currentDatabaseRecord);
                if (mapOfIdentifierAndPreEditRecord.has(identifier)) {
                    mapOfIdentifierAndCurrentDatabaseRecord.set(identifier, currentDatabaseRecord);
                }
                else {
                    conflictRecords.push(currentDatabaseRecord);
                }
            }
            const deletedRecords = [];
            for (const preEditRecord of this._preEditRecords) {
                const identifier = this.getIdentifier(preEditRecord);
                const currentDatabaseRecord = mapOfIdentifierAndCurrentDatabaseRecord.get(identifier);
                if (typeof currentDatabaseRecord !== "undefined") {
                    const preEditRecordUpdateTime = this.getLastUpdateTime(preEditRecord);
                    const currentDatabaseRecordUpdateTime = this.getLastUpdateTime(currentDatabaseRecord);
                    if (preEditRecordUpdateTime !== null && currentDatabaseRecordUpdateTime !== null && preEditRecordUpdateTime.getTime() < currentDatabaseRecordUpdateTime.getTime()) {
                        conflictRecords.push(currentDatabaseRecord);
                    }
                }
                else {
                    deletedRecords.push(preEditRecord);
                }
            }
            if (conflictRecords.length > 0) {
                throw new RecordConflictError(conflictRecords);
            }
            if (deletedRecords.length > 0) {
                const mapOfIdentifierAndRecord = new Map();
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
    async update() {
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
        }
        else {
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
    async exists() {
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
        const numberOfRecords = await this._connector.fetchField(sql.toString(), this._whereSet.buildParameters());
        return (numberOfRecords > 0);
    }
    /**
     * バインドされているレコードが有効か検証する。
     *
     * @throws RecordMapValidationError 検証に失敗した場合。
     */
    async validate() {
        for (const record of this.records) {
            const errors = new Map();
            for (const column of this.getColumns()) {
                try {
                    await this.valueValidate(record, column);
                }
                catch (error) {
                    errors.set(column, error.message);
                }
            }
            if (errors.size > 0) {
                throw new RecordMapValidationError(record, errors);
            }
        }
    }
    /**
     * バインドされているレコードの値を標準化する。
     */
    async normalize() {
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
