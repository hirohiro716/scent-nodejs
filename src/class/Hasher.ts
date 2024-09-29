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
    public constructor(algorithm: string = "sha256") {
        this._algorithm = algorithm;
    }

    private _algorithm: string;

    /**
     * ハッシュ化に使用されるアルゴリズム。
     */
    public get algorithm(): string {
        return this._algorithm;
    }

    public set algorithm(algorithm: string) {
        this._algorithm = algorithm;
    }

    /**
     * 指定された文字列をハッシュ化する。
     * 
     * @param target 
     * @returns 
     */
    public hash(target: string): string {
        const hash = Crypto.createHash(this._algorithm);
        hash.update(target);
        return hash.digest("hex");
    }

    /**
     * ハッシュ化に使用できるアルゴリズムを取得する。
     * 
     * @returns 
     */
    public static getAlgorithms(): string[] {
        return Crypto.getHashes();
    }
}
