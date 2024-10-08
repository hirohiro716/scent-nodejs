import { Column, Datetime, StringObject } from "scent-typescript";
import { Comparison, Comparisons } from "./Comparison.js";

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
export class WhereSet {

    /**
     * コンストラクタ。
     */
    public constructor();

    /**
     * コンストラクタ。Whereインスタンスの配列を指定する。
     * 
     * @param wheres 
     */
    public constructor(wheres: Where[]);

    /**
     * コンストラクタ。Whereインスタンスを復元するオブジェクトの配列を指定する。
     * 
     * @param source 
     */
    public constructor(source: {column: string, comparison: string, is_negate: boolean, values: [{class_name: string, value: null | boolean | string | number}]}[]);

    /**
     * コンストラクタ。Whereインスタンスを復元するオブジェクトの配列を指定する。
     * 
     * @param source 
     */
    public constructor(source: {column: string, comparison: string, isNegate: boolean, values: null | boolean | string | string[] | number | number[]}[]);

    /**
     * @deprecated
     */
    public constructor(source?: Where[] | {column: string, comparison: string, isNegate: boolean, values: null | boolean | string | string[] | number | number[]}[] | {column: string, comparison: string, is_negate: boolean, values: [{class_name: string, value: null | boolean | string | number}]}[]) {
        this._wheres = [];
        if (typeof source !== "undefined" && source.length > 0) {
            for (const where of source) {
                if (where instanceof Where) {
                    this._wheres.push(where);
                } else {
                    if ("isNegate" in where) {
                        const comparison = Comparison.findComparison(where.comparison);
                        if (comparison) {
                            this._wheres.push(new Where(where.column, comparison, where.values, where.isNegate));
                        }
                    }
                    // For scent-java library
                    if ("is_negate" in where) {
                        for (const comparison of Object.values(Comparisons)) {
                            if (StringObject.from(where.comparison).equals(comparison.physicalName)) {
                                if (where.values.length === 1) {
                                    this._wheres.push(new Where(where.column, comparison, where.values[0].value, where.is_negate));
                                } else {
                                    const stringValues: string[] = [];
                                    const numberValues: number[] = [];
                                    for (const valueObject of where.values) {
                                        const value = valueObject.value;
                                        if (typeof value === "string") {
                                            stringValues.push(value);
                                        }
                                        if (typeof value === "number") {
                                            numberValues.push(value);
                                        }
                                    }
                                    if (stringValues.length > 0) {
                                        this._wheres.push(new Where(where.column, comparison, stringValues, where.is_negate));
                                    }
                                    if (numberValues.length > 0) {
                                        this._wheres.push(new Where(where.column, comparison, numberValues, where.is_negate));
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    private _wheres: Where[];

    /**
     * 内部のWhereインスタンスの配列。
     */
    public get wheres(): Where[] {
        return this._wheres;
    }

    /**
     * 内部のWhereインスタンスの数を取得する。
     * 
     * @returns 
     */
    public length(): number {
        return this.wheres.length;
    }

    /**
     * 内部のWhereインスタンスをクリアする。
     */
    public clear(): void {
        this._wheres = [];
    }

    /**
     * 検索条件を追加する。
     * 
     * @param where 
     */
    public add(where: Where): void;

    /**
     * 検索条件を追加する。
     * 
     * @param column 検索対象のカラム名。
     * @param comparison 比較演算子。
     * @param values 比較値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    public add(column: Column | string, comparison: Comparison, values?: null | boolean | string | string[] | number | number[] | Date | Date[] | Datetime | Datetime[], isNegate?: boolean): void;

    /**
     * @deprecated
     */
    public add(parameter1: Where | Column | string, comparison?: Comparison, values?: null | boolean | string | string[] | number | number[] | Date | Date[] | Datetime | Datetime[], isNegate?: boolean): void {
        if (parameter1 instanceof Where) {
            this.wheres.push(parameter1);
        } else if (typeof comparison !== "undefined") {
            if (typeof values !== "undefined") {
                this.wheres.push(new Where(parameter1, comparison, values, isNegate));
            } else {
                this.wheres.push(new Where(parameter1, comparison, null, isNegate));
            }
        }
    }

    /**
     * BETWEENを使用した検索条件を追加する。
     * 
     * @param column 検索対象のカラム名。
     * @param parameterFrom 範囲指定検索の開始値。
     * @param parameterTo 範囲指定検索の終了値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    public addBetween(column: Column | string, parameterFrom: string | number | Date | Datetime, parameterTo: string | number | Date | Datetime, isNegate?: boolean): void {
        const parameter2Object = new StringObject(parameterTo);
        if (typeof parameterFrom === "string") {
            this.add(column, Comparisons.between, [parameterFrom, parameter2Object.toString()], isNegate);
        } else if (typeof parameterFrom === "number" && parameter2Object.toNumber() !== null) {
            this.add(column, Comparisons.between, [parameterFrom, parameter2Object.toNumber()!], isNegate);
        }
    }

    /**
     * INを使用した検索条件を追加する。
     * 
     * @param column 検索対象のカラム名。
     * @param values 検索に使用する値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    public addIn(column: Column | string, values: string[] | number[] | Date[] | Datetime[], isNegate?: boolean) {
        this.add(column, Comparisons.in, values, isNegate);
    }

    /**
     * IS NULLを使用した検索条件を追加する。
     * 
     * @param column 検索対象のカラム名。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    public addIsNull(column: Column | string, isNegate?: boolean) {
        this.add(column, Comparisons.isNull, null, isNegate);
    }
    
    /**
     * 内部のWhereインスタンスの中から、指定されたカラム名に一致するインスタンスを返す。
     * 
     * @param column 
     * @returns 
     */
    public findWhere(column: Column | string): Where | null {
        let physicalName: string;
        if (column instanceof Column) {
            physicalName = column.physicalName;
        } else {
            physicalName = column;
        }
        for (const where of this._wheres) {
            if (where.column === physicalName) {
                return where;
            }
        }
        return null;
    }

    /**
     * WHERE句で使用できるプレースホルダを作成する。
     * 
     * @returns 
     */
    public buildPlaceholderClause(): string {
        const result = new StringObject();
        for (const where of this._wheres) {
            if (result.length() > 0) {
                result.append(" AND ");
            }
            result.append(where.buildPlaceholderClause());
        }
        return result.toString();
    }

    /**
     * WHERE句のプレースホルダに対するバインド変数の配列を作成する。
     * 
     * @returns 
     */
    public buildParameters(): (boolean | string | number | Date | Datetime)[] {
        const parameters: (boolean | string | number | Date | Datetime)[] = [];
        for (const where of this._wheres) {
            switch (where.comparison) {
                case Comparisons.between:
                case Comparisons.in:
                    where.values.forEach((value) => {parameters.push(value)});
                    break;
                case Comparisons.isNull:
                    break;
                default:
                    parameters.push(where.values[0]);
                    break;
            }
        }
        return parameters;
    }

    /**
     * このインスタンスを配列に変換する。
     * 
     * @returns 
     */
    public toObject(): {column: string, comparison: string, isNegate: boolean, values: null | boolean | string | string[] | number | number[]}[] {
        const result: {column: string, comparison: string, isNegate: boolean, values: null | boolean | string | string[] | number | number[]}[] = [];
        for (const where of this._wheres) {
            const values: any[] = [];
            for (const value of where.values) {
                if (value instanceof Datetime) {
                    values.push(value.toString());
                } else if (value instanceof Date) {
                    values.push(Datetime.from(value).toString());
                } else {
                    values.push(value);
                }
            }
            result.push({
                column: where.column,
                comparison: where.comparison.physicalName,
                isNegate: where.isNegate,
                values: values,
            });
        }
        return result;
    }
    
    /**
     * このインスタンスのクローンを作成する。
     * 
     * @returns 
     */
    public clone(): WhereSet {
        return new WhereSet(this.toObject());
    }
}

/**
 * SQLのWHERE句をプレースホルダとバインド変数を使用して作成するクラス。
 * 最終的に下記のような、WHEREで使用するプレースホルダと、レコード検索で使用するバインド変数を作成することができる。
 * @example
 * const where = new Where("column1", Comparisons.equal, "検索値1");
 * where.buildPlaceholderClause() returns "column1 = ?"
 * where.values returns ["検索値1"]
 */
export class Where {

    /**
     * コンストラクタ。
     * 
     * @param column 検索対象のカラム名。
     * @param comparison 比較演算子。
     * @param values 比較値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    public constructor(column: Column | string, comparison: Comparison, values: null | boolean | boolean[] | string | string[] | number | number[] | Date | Date[] | Datetime | Datetime[], isNegate?: boolean) {
        if (column instanceof Column) {
            this.column = column.physicalName;
        } else {
            this.column = column;
        }
        this.comparison = comparison;
        this.values = [];
        if (Array.isArray(values)) {
            values.forEach((value) => this.values.push(value));
        } else if (values !== null) {
            this.values.push(values);
        }
        if (typeof isNegate !== "undefined" && isNegate === true) {
            this.isNegate = true;
        } else {
            this.isNegate = false;
        }
    }

    /**
     * 検索対象のカラム名。
     */
    public readonly column: string;

    /**
     * 比較演算子。
     */
    public readonly comparison: Comparison;

    /**
     * 比較値。
     */
    public readonly values: (boolean | string | number | Date | Datetime)[];

    /**
     * 比較値。
     */
    public get value(): boolean | string | number | Date | Datetime | null {
        if (this.values.length > 0) {
            return this.values[0];
        }
        return null;
    }

    /**
     * 論理否定の場合はtrueを指定。
     */
    public readonly isNegate: boolean;

    /**
     * WHERE句で使用できるプレースホルダを作成する。
     * 
     * @returns 
     */
    public buildPlaceholderClause(): string {
        const result = new StringObject();
        if (this.isNegate) {
            result.append("NOT ");
        }
        result.append(this.column).append(" ");
        switch (this.comparison) {
            case Comparisons.between:
                result.append(this.comparison.physicalName);
                result.append(" ? AND ?");
                break;
            case Comparisons.in:
                result.append(this.comparison.physicalName);
                result.append(" (");
                for (let index = 0; index < this.values.length; index++) {
                    if (index > 0) {
                        result.append(", ");
                    }
                    result.append("?");
                }
                result.append(")");
                break;
            case Comparisons.isNull:
                result.append(this.comparison.physicalName);
                break;
            default:
                result.append(this.comparison.physicalName);
                result.append(" ?");
                break;
        }
        return result.toString();
    }

    /**
     * このインスタンスのクローンを作成する。
     * 
     * @returns 
     */
    public clone(): Where {
        const values: any[] = this.values;
        return new Where(this.column, this.comparison, values, this.isNegate);
    }
}
