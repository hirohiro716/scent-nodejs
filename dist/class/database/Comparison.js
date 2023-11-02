import { Enumeration } from "scent-typescript";
/**
 * データベースで使用する比較演算子の定数クラス。
 */
export class Comparison extends Enumeration {
    /**
     * 指定された物理名に一致する定数を返す。見つからなかった場合はnullを返す。
     *
     * @param physicalName
     * @returns
     */
    static findComparison(physicalName) {
        return Comparison.findEnumeration(Comparisons, physicalName);
    }
}
/**
 * データベースで使用する比較演算子の種類。
 */
export const Comparisons = {
    equal: new Comparison("=", "equal"),
    notEqual: new Comparison("!=", "notEqual"),
    less: new Comparison("<", "less"),
    lessEqual: new Comparison("<=", "lessEqual"),
    greater: new Comparison(">", "greater"),
    greaterEqual: new Comparison(">=", "greaterEqual"),
    in: new Comparison("IN", "in"),
    isNull: new Comparison("IS NULL", "isNull"),
    like: new Comparison("LIKE", "like"),
    between: new Comparison("BETWEEN", "between"),
    similarTo: new Comparison("SIMILAR TO", "similarTo"),
    regexp: new Comparison("REGEXP", "regexp"),
};
