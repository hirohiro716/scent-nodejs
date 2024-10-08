import { Column, Datetime } from "scent-typescript";
import { Comparison } from "./Comparison.js";
/**
 * SQLのWHERE句をプレースホルダとバインド変数を使用して作成するクラス。
 * 最終的に下記のような、WHEREで使用するプレースホルダと、レコード検索で使用するバインド変数を作成することができる。
 * @example
 * const whereSet = new WhereSet();
 * whereSet.add("column1", "検索値1");
 * whereSet.add("column2", "検索値2");
 * whereSet.buildPlaceholderClause() returns "column1 = ? AND column2 = ?"
 * whereSet.buildParameters() returns ["検索値1", "検索値2"]
 */
export declare class WhereSet {
    /**
     * コンストラクタ。
     */
    constructor();
    /**
     * コンストラクタ。Whereインスタンスの配列を指定する。
     *
     * @param wheres
     */
    constructor(wheres: Where[]);
    /**
     * コンストラクタ。Whereインスタンスを復元するオブジェクトの配列を指定する。
     *
     * @param source
     */
    constructor(source: {
        column: string;
        comparison: string;
        is_negate: boolean;
        values: [{
            class_name: string;
            value: null | boolean | string | number;
        }];
    }[]);
    /**
     * コンストラクタ。Whereインスタンスを復元するオブジェクトの配列を指定する。
     *
     * @param source
     */
    constructor(source: {
        column: string;
        comparison: string;
        isNegate: boolean;
        values: null | boolean | string | string[] | number | number[];
    }[]);
    private _wheres;
    /**
     * 内部のWhereインスタンスの配列。
     */
    get wheres(): Where[];
    /**
     * 内部のWhereインスタンスの数を取得する。
     *
     * @returns
     */
    length(): number;
    /**
     * 内部のWhereインスタンスをクリアする。
     */
    clear(): void;
    /**
     * 検索条件を追加する。
     *
     * @param where
     */
    add(where: Where): void;
    /**
     * 検索条件を追加する。
     *
     * @param column 検索対象のカラム名。
     * @param comparison 比較演算子。
     * @param values 比較値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    add(column: Column | string, comparison: Comparison, values?: null | boolean | string | string[] | number | number[] | Date | Date[] | Datetime | Datetime[], isNegate?: boolean): void;
    /**
     * BETWEENを使用した検索条件を追加する。
     *
     * @param column 検索対象のカラム名。
     * @param parameterFrom 範囲指定検索の開始値。
     * @param parameterTo 範囲指定検索の終了値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    addBetween(column: Column | string, parameterFrom: string | number | Date | Datetime, parameterTo: string | number | Date | Datetime, isNegate?: boolean): void;
    /**
     * INを使用した検索条件を追加する。
     *
     * @param column 検索対象のカラム名。
     * @param values 検索に使用する値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    addIn(column: Column | string, values: string[] | number[] | Date[] | Datetime[], isNegate?: boolean): void;
    /**
     * IS NULLを使用した検索条件を追加する。
     *
     * @param column 検索対象のカラム名。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    addIsNull(column: Column | string, isNegate?: boolean): void;
    /**
     * 内部のWhereインスタンスの中から、指定されたカラム名に一致するインスタンスを返す。
     *
     * @param column
     * @returns
     */
    findWhere(column: Column | string): Where | null;
    /**
     * WHERE句で使用できるプレースホルダを作成する。
     *
     * @returns
     */
    buildPlaceholderClause(): string;
    /**
     * WHERE句のプレースホルダに対するバインド変数の配列を作成する。
     *
     * @returns
     */
    buildParameters(): (boolean | string | number | Date | Datetime)[];
    /**
     * このインスタンスを配列に変換する。
     *
     * @returns
     */
    toObject(): {
        column: string;
        comparison: string;
        isNegate: boolean;
        values: null | boolean | string | string[] | number | number[];
    }[];
    /**
     * このインスタンスのクローンを作成する。
     *
     * @returns
     */
    clone(): WhereSet;
}
/**
 * SQLのWHERE句をプレースホルダとバインド変数を使用して作成するクラス。
 * 最終的に下記のような、WHEREで使用するプレースホルダと、レコード検索で使用するバインド変数を作成することができる。
 * @example
 * const where = new Where("column1", Comparisons.equal, "検索値1");
 * where.buildPlaceholderClause() returns "column1 = ?"
 * where.values returns ["検索値1"]
 */
export declare class Where {
    /**
     * コンストラクタ。
     *
     * @param column 検索対象のカラム名。
     * @param comparison 比較演算子。
     * @param values 比較値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    constructor(column: Column | string, comparison: Comparison, values: null | boolean | boolean[] | string | string[] | number | number[] | Date | Date[] | Datetime | Datetime[], isNegate?: boolean);
    /**
     * 検索対象のカラム名。
     */
    readonly column: string;
    /**
     * 比較演算子。
     */
    readonly comparison: Comparison;
    /**
     * 比較値。
     */
    readonly values: (boolean | string | number | Date | Datetime)[];
    /**
     * 比較値。
     */
    get value(): boolean | string | number | Date | Datetime | null;
    /**
     * 論理否定の場合はtrueを指定。
     */
    readonly isNegate: boolean;
    /**
     * WHERE句で使用できるプレースホルダを作成する。
     *
     * @returns
     */
    buildPlaceholderClause(): string;
    /**
     * このインスタンスのクローンを作成する。
     *
     * @returns
     */
    clone(): Where;
}
