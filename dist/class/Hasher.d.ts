/**
 * 文字列をハッシュ化するクラス。
 *
 * @author hiro
 */
export default class Hasher {
    /**
     * コンストラクタ。
     * ハッシュ化に使用するアルゴリズムを指定する。未指定の場合は"sha256"が使用される。
     *
     * @param algorithm
     */
    constructor(algorithm?: string);
    private _algorithm;
    /**
     * ハッシュ化に使用されるアルゴリズム。
     */
    get algorithm(): string;
    set algorithm(algorithm: string);
    /**
     * 指定された文字列をハッシュ化する。
     *
     * @param target
     * @returns
     */
    hash(target: string): string;
    /**
     * ハッシュ化に使用できるアルゴリズムを取得する。
     *
     * @returns
     */
    static getAlgorithms(): string[];
}
