import { Readable } from "stream";
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
     * QRコードをデコードして内容を取得する。
     *
     * @returns
     * @throws Error QRコードの解析に失敗した場合。
     */
    decode(): Promise<string>;
    /**
     * QRコードの画像を読み込むストリームを作成する。
     *
     * @param type ファイル形式。デフォルトは"svg"。
     * @returns
     */
    createReadStream(type?: Type): Promise<Readable>;
}
export {};
