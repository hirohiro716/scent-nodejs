import Connector from "./Connector.js";
import { Table } from "scent-typescript";
import { WhereSet } from "./WhereSet.js";
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
    constructor(connector: C | null);
    private _connector;
    /**
     * 接続に使用するデータベースインスタンス。
     */
    get connector(): C | null;
    set connector(connector: C);
    /**
     * レコードが保存されているテーブルを取得する。
     *
     * @returns
     */
    abstract getTable(): Table<any>;
    /**
     * 検索条件を指定してデータベースからレコード検索する。
     *
     * @param whereSets 検索条件。複数の指定がある場合はOR演算子で連結される。
     * @param partBeforeWhere WHERE句の前までのSELECT句からFROM句までのSQL。
     * @param partAfterWhere WHERE句の後の構文。GROUP BY句、HAVING句、ORDER BY句、LIMIT句など。
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    search(whereSets: WhereSet[], partBeforeWhere?: string, partAfterWhere?: string): Promise<Record<string, any>[]>;
}
