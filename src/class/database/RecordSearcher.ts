import Connector from "./Connector.js";
import { Column, SearchResult, StringObject, Table, WhereSet } from "scent-typescript";
import DatabaseError from "./DatabaseError.js";

/**
 * データベースのレコードを検索するための抽象クラス。
 * 
 * @template C データベースコネクターの型。
 */
export default abstract class RecordSearcher<C extends Connector<any, any>> {

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
     * 
     * @returns
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
     * 検索対象のテーブルを取得する。
     * 
     * @returns
     */
    public abstract getTable(): Table<any>;

    /**
     * 検索結果に含まれるカラムを取得する。
     * 
     * @returns
     */
    public abstract getColumns(): Column[];

    /**
     * 結果結果のカラムの代わりとなる関数を取得する。
     * 
     * @param column 
     * @returns
     */
    public abstract getFunctionInsteadOfColumn(column: Column): Promise<string | undefined>;

    /**
     * データベースから取得したレコードオブジェクト配列から検索結果のインスタンスを作成する。
     * 
     * @returns
     */
    public abstract createSearchResult(records: Record<string, any>[]): SearchResult;

    /**
     * 検索条件を指定してデータベースからレコード検索する。
     * 
     * @param whereSets 検索条件。複数の指定がある場合はOR演算子で連結される。
     * @param partBeforeWhere WHERE句の前までのSELECT句からFROM句までのSQL。
     * @param partAfterWhere WHERE句の後の構文。GROUP BY句、HAVING句、ORDER BY句、LIMIT句など。
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public async search(whereSets: WhereSet[], partBeforeWhere?: string, partAfterWhere?: string): Promise<SearchResult> {
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
                } else {
                    sql.append(column.fullPhysicalName);
                }
            }
            sql.append(" FROM ").append(this.getTable().physicalName);
        }
        const wherePart = new StringObject();
        const parameters: any[] = [];
        if (whereSets.length > 0) {
            for (const whereSet of whereSets) {
                if (whereSet.length() > 0) {
                    if (wherePart.length() === 0) {
                        wherePart.append(" WHERE ");
                    } else {
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
