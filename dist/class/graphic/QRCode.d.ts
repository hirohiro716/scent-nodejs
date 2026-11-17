import { ByteArray } from "scent-typescript";
type Type = "png" | "svg";
/**
 * QRコードのクラス。
 */
export default class QRCode {
    /**
     * コンストラクタ。QRコードの内容、または画像データを指定する。
     *
     * @param contentOrImageData
     */
    constructor(contentOrImageData: string | Buffer | ByteArray);
    private readonly contentOrImageData;
    /**
     * QRコードを内容の文字列に変換する。
     *
     * @returns
     * @throws Error QRコードの解析に失敗した場合。
     */
    toString(): Promise<string>;
    /**
     * QRコードの画像データをバイト配列に変換する。
     *
     * @param type ファイル形式。デフォルトは"svg"。
     * @returns
     */
    toByteArray(type?: Type): Promise<ByteArray>;
}
export {};
