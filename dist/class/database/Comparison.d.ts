import { Enumeration } from "scent-typescript";
/**
 * データベースで使用する比較演算子の定数クラス。
 */
export declare class Comparison extends Enumeration {
    /**
     * 指定された物理名に一致する定数を返す。見つからなかった場合はnullを返す。
     *
     * @param physicalName
     * @returns
     */
    static findComparison(physicalName: string): Comparison | null;
}
/**
 * データベースで使用する比較演算子の種類。
 */
export declare const Comparisons: {
    equal: Comparison;
    notEqual: Comparison;
    less: Comparison;
    lessEqual: Comparison;
    greater: Comparison;
    greaterEqual: Comparison;
    in: Comparison;
    isNull: Comparison;
    like: Comparison;
    between: Comparison;
    similarTo: Comparison;
    regexp: Comparison;
};
