import { RecordMap, StringObject } from "scent-typescript";
import { DataNotFoundError, Connector as ParentConnector, DatabaseError } from "./Connector.js";
import RecordBinder from "./RecordBinder.js";

/**
 * データベースの単一レコードとオブジェクトをバインドするための抽象クラス。
 * 
 * @template C データベースコネクターの型。
 */
export default abstract class SingleRecordBinder<C extends ParentConnector<any, any>> extends RecordBinder<C> {

    /**
     * @deprecated
     */
    public get records(): RecordMap[] {
        return super.records;
    }

    /**
     * @deprecated
     */
    public set records(records: RecordMap[]) {
        super.records = records;
    }

    /**
     * バインドされているレコード。
     */
    public get record(): RecordMap {
        if (super.records.length === 0) {
            super.records = [this.getTable().createRecord()];
        }
        return super.records[0];
    }

    public set record(record: RecordMap) {
        super.records = [record];
    }

    /**
     * 初期値が入力されたレコードをセットする。
     */
    public async setDefaultRecord(): Promise<void> {
        const records: RecordMap[] = [];
        try {
            records.push(await this.createDefaultRecord());
        } catch (error: any) {
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
    public async insert(): Promise<void> {
        if (this.connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        if (this.record === null) {
            throw new DatabaseError("Record for inserting is missing.");
        }
        await this.connector.insert(this.record, this.getTable());
    }

    /**
     * バインドするレコードを排他制御を行ってから取得する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     * @returns
     */
    protected abstract fetchRecordForEdit(): Promise<Record<string, any>>;

    protected getOrderByColumnsForEdit(): string[] {
        return [];
    }

    protected async fetchRecordsForEdit(orderByColumnsForEdit: string[]): Promise<Record<string, any>[]> {
        return [await this.fetchRecordForEdit()];
    }

    protected isPermittedUpdateWhenEmptySearchCondition(): boolean {
        return false;
    }

    /**
     * バインドされたレコードが、すでに削除されている場合trueを返す。テーブルが論理削除仕様の場合にtrueかfalseを返し、物理削除仕様の場合は常にfalseを返す。
     * 
     * @returns
     */
    public abstract isDeleted(): boolean;

    /**
     * データベースのレコードをこのインスタンスにバインドする。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async edit(): Promise<void> {
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
    public async update(): Promise<void> {
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
    public async physicalDelete(): Promise<void> {
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

    /**
     * バインドされているレコードを削除処理する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract delete(): Promise<void>;
}
