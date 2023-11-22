import { StringObject } from "scent-typescript";
import { DatabaseError } from "./Connector.js";
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
        this._connector = connector;
    }
    /**
     * 接続に使用するデータベースインスタンス。
     */
    get connector() {
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
        return this.getTable().columns;
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
     * データベースのレコードをこのインスタンスにバインドする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async edit() {
        const editingRecords = [];
        for (const record of await this.fetchRecordsForEdit(this.getOrderByColumnsForEdit())) {
            editingRecords.push(this.getTable().createRecord(record));
        }
        this.editingRecords = editingRecords;
    }
    /**
     * このインスタンスにバインドされているレコードでデータベースのレコードを上書きする。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async update() {
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
        const sql = new StringObject("SELECT (*) FROM ");
        sql.append(this.getTable().physicalName);
        sql.append(" WHERE ");
        sql.append(this._whereSet.buildPlaceholderClause());
        sql.append(";");
        const numberOfRecords = await this._connector.fetchField(sql.toString(), this._whereSet.buildParameters());
        return (numberOfRecords > 0);
    }
}
