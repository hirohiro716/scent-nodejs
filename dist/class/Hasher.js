import { default as Crypto } from "crypto";
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
    constructor(algorithm = "sha256") {
        this._algorithm = algorithm;
    }
    /**
     * ハッシュ化に使用されるアルゴリズム。
     */
    get algorithm() {
        return this._algorithm;
    }
    set algorithm(algorithm) {
        this._algorithm = algorithm;
    }
    /**
     * 指定された文字列をハッシュ化する。
     *
     * @param target
     * @returns
     */
    async hash(target) {
        const hash = Crypto.createHash(this._algorithm);
        hash.update(target);
        return hash.digest("hex");
    }
    /**
     * ハッシュ化に使用できるアルゴリズムを取得する。
     *
     * @returns
     */
    static getAlgorithms() {
        return Crypto.getHashes();
    }
}
