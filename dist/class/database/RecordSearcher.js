import { StringObject } from "scent-typescript";
import DatabaseError from "./DatabaseError.js";
/**
 * データベースのレコードを検索するための抽象クラス。
 *
 * @template C データベースコネクターの型。
 */
export default class RecordSearcher {
    /**
     * コンストラクタ。接続済みデータベースインスタンスを指定する。
     *
     * @param connector
     */
    constructor(connector) {
        this._connector = connector;
    }
    /**
     * 接続に使用するデータベースインスタンス。
     *
     * @returns
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
     * 検索条件を指定してデータベースからレコード検索する。
     *
     * @param whereSets 検索条件。複数の指定がある場合はOR演算子で連結される。
     * @param partBeforeWhere WHERE句の前までのSELECT句からFROM句までのSQL。
     * @param partAfterWhere WHERE句の後の構文。GROUP BY句、HAVING句、ORDER BY句、LIMIT句など。
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    async search(whereSets, partBeforeWhere, partAfterWhere) {
        if (this._connector === null) {
            throw new DatabaseError("Connector instance is missing.");
        }
        const sql = new StringObject(partBeforeWhere);
        if (sql.length() === 0) {
            sql.append("SELECT ");
            for (const column of this.getColumns()) {
                if (sql.length() > 7) {
                    sql.append(", ");
                }
                const sqlFunction = await this.getFunctionInsteadOfColumn(column);
                if (sqlFunction) {
                    sql.append(sqlFunction);
                    sql.append(" AS ");
                    sql.append(column.physicalName);
                }
                else {
                    sql.append(column.fullPhysicalName);
                }
            }
            sql.append(" FROM ").append(this.getTable().physicalName);
        }
        const wherePart = new StringObject();
        const parameters = [];
        if (whereSets.length > 0) {
            for (const whereSet of whereSets) {
                if (whereSet.length() > 0) {
                    if (wherePart.length() === 0) {
                        wherePart.append(" WHERE ");
                    }
                    else {
                        wherePart.append(" OR ");
                    }
                    wherePart.append(whereSet.buildPlaceholderClause());
                    whereSet.buildParameters().forEach((value) => parameters.push(value));
                }
            }
        }
        sql.append(wherePart);
        if (StringObject.from(partAfterWhere).length() > 0) {
            sql.append(" ");
            sql.append(partAfterWhere);
        }
        sql.append(";");
        return this.createSearchResult(await this._connector.fetchRecords(sql.toString(), parameters));
    }
}
