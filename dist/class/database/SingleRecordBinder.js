import { StringObject } from "scent-typescript";
import RecordBinder from "./RecordBinder.js";
import DatabaseError from "./DatabaseError.js";
import DataNotFoundError from "./DataNotFoundError.js";
/**
 * データベースの単一レコードとオブジェクトをバインドするための抽象クラス。
 *
 * @template C データベースコネクターの型。
 */
export default class SingleRecordBinder extends RecordBinder {
    /**
     * @deprecated
     */
    get records() {
        return super.records;
    }
    /**
     * @deprecated
     */
    set records(records) {
        super.records = records;
    }
    /**
     * バインドされているレコード。
     */
    get record() {
        if (super.records.length === 0) {
            super.records = [this.getTable().createRecord()];
        }
        return super.records[0];
    }
    set record(record) {
        super.records = [record];
    }
    /**
     * 初期値が入力されたレコードをセットする。
     */
    async setDefaultRecord() {
        const records = [];
        try {
            records.push(await this.createDefaultRecord());
        }
        catch (error) {
            console.log(error);
            records.push(this.getTable().createRecord());
        }
        super.records = records;
    }
    /**
     * このインスタンスにバインドされているレコードをデータベースに追加する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async insert() {
        if (this.connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        if (this.record === null) {
            throw new DatabaseError("Record for inserting is missing.");
        }
        await this.connector.insert(this.record, this.getTable());
    }
    getOrderByColumnsForEdit() {
        return [];
    }
    async fetchRecordsForEdit(orderByColumnsForEdit) {
        return [await this.fetchRecordForEdit()];
    }
    isPermittedUpdateWhenEmptySearchCondition() {
        return false;
    }
    /**
     * データベースのレコードをこのインスタンスにバインドする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async edit() {
        await super.edit();
        if (super.records.length === 0 || this.isDeleted()) {
            throw new DataNotFoundError();
        }
        if (super.records.length > 1) {
            throw new DatabaseError("Multiple records found.");
        }
    }
    /**
     * このインスタンスにバインドされているレコードでデータベースのレコードを上書きする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async update() {
        if (this.connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        if (this.record === null) {
            throw new DatabaseError("Record for updating is missing.");
        }
        if (this.whereSet === null) {
            throw new DatabaseError("Search condition for updating is missing.");
        }
        await this.connector.update(this.record, this.getTable(), this.whereSet);
    }
    /**
     * 設定されている検索条件に該当するレコードをデータベースから物理削除する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async physicalDelete() {
        if (this.connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        if (this.whereSet === null) {
            throw new DatabaseError("Search condition for deleting is missing.");
        }
        const sql = new StringObject("DELETE FROM ");
        sql.append(this.getTable().physicalName);
        sql.append(" WHERE ");
        sql.append(this.whereSet.buildPlaceholderClause());
        sql.append(";");
        this.connector.execute(sql.toString(), this.whereSet.buildParameters());
    }
}
