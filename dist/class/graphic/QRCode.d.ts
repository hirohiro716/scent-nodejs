/// <reference types="node" />
/// <reference types="node" />
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
     */
    decode(): Promise<string>;
    /**
     * QRコードの画像を読み込むストリームを作成する。
     *
     * @param type ファイル形式。デフォルトは"svg"。
     * @param highWaterMark バッファの容量の制限。
     * @returns
     */
    createReadStream(type?: Type, highWaterMark?: number): Promise<Readable>;
}
export {};
