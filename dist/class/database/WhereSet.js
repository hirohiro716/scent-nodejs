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
     * @deprecated
     */
    constructor(source) {
        this._wheres = [];
        if (typeof source !== "undefined" && source.length > 0) {
            for (const where of source) {
                if (where instanceof Where) {
                    this._wheres.push(where);
                }
                else {
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
                                }
                                else {
                                    const stringValues = [];
                                    const numberValues = [];
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
    /**
     * 内部のWhereインスタンスの配列。
     */
    get wheres() {
        return this._wheres;
    }
    /**
     * 内部のWhereインスタンスの数を取得する。
     *
     * @returns
     */
    length() {
        return this.wheres.length;
    }
    /**
     * 内部のWhereインスタンスをクリアする。
     */
    clear() {
        this._wheres = [];
    }
    /**
     * @deprecated
     */
    add(parameter1, comparison, values, isNegate) {
        if (parameter1 instanceof Where) {
            this.wheres.push(parameter1);
        }
        else if (typeof comparison !== "undefined") {
            if (typeof values !== "undefined") {
                this.wheres.push(new Where(parameter1, comparison, values, isNegate));
            }
            else {
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
    addBetween(column, parameterFrom, parameterTo, isNegate) {
        const parameter2Object = new StringObject(parameterTo);
        if (typeof parameterFrom === "string") {
            this.add(column, Comparisons.between, [parameterFrom, parameter2Object.toString()], isNegate);
        }
        else if (typeof parameterFrom === "number" && parameter2Object.toNumber() !== null) {
            this.add(column, Comparisons.between, [parameterFrom, parameter2Object.toNumber()], isNegate);
        }
    }
    /**
     * INを使用した検索条件を追加する。
     *
     * @param column 検索対象のカラム名。
     * @param values 検索に使用する値。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    addIn(column, values, isNegate) {
        this.add(column, Comparisons.in, values, isNegate);
    }
    /**
     * IS NULLを使用した検索条件を追加する。
     *
     * @param column 検索対象のカラム名。
     * @param isNegate 論理否定の場合はtrueを指定。
     */
    addIsNull(column, isNegate) {
        this.add(column, Comparisons.isNull, null, isNegate);
    }
    /**
     * 内部のWhereインスタンスの中から、指定されたカラム名に一致するインスタンスを返す。
     *
     * @param column
     * @returns
     */
    findWhere(column) {
        let physicalName;
        if (column instanceof Column) {
            physicalName = column.physicalName;
        }
        else {
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
    buildPlaceholderClause() {
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
    buildParameters() {
        const parameters = [];
        for (const where of this._wheres) {
            switch (where.comparison) {
                case Comparisons.between:
                case Comparisons.in:
                    where.values.forEach((value) => { parameters.push(value); });
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
    toObject() {
        const result = [];
        for (const where of this._wheres) {
            const values = [];
            for (const value of where.values) {
                if (value instanceof Datetime) {
                    values.push(value.toString());
                }
                else if (value instanceof Date) {
                    values.push(Datetime.from(value).toString());
                }
                else {
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
    clone() {
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
    constructor(column, comparison, values, isNegate) {
        if (column instanceof Column) {
            this.column = column.physicalName;
        }
        else {
            this.column = column;
        }
        this.comparison = comparison;
        this.values = [];
        if (Array.isArray(values)) {
            values.forEach((value) => this.values.push(value));
        }
        else if (values !== null) {
            this.values.push(values);
        }
        if (typeof isNegate !== "undefined" && isNegate === true) {
            this.isNegate = true;
        }
        else {
            this.isNegate = false;
        }
    }
    /**
     * 比較値。
     */
    get value() {
        if (this.values.length > 0) {
            return this.values[0];
        }
        return null;
    }
    /**
     * WHERE句で使用できるプレースホルダを作成する。
     *
     * @returns
     */
    buildPlaceholderClause() {
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
    clone() {
        const values = this.values;
        return new Where(this.column, this.comparison, values, this.isNegate);
    }
}
