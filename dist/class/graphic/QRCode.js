import jsQR from "jsqr";
import * as nodeQrcode from "qrcode";
import { ByteArray } from "scent-typescript";
import sharp from "sharp";
/**
 * QRコードのクラス。
 */
export default class QRCode {
    /**
     * コンストラクタ。QRコードの内容、または画像データを指定する。
     *
     * @param contentOrImageData
     */
    constructor(contentOrImageData) {
        this.contentOrImageData = contentOrImageData;
    }
    /**
     * QRコードを内容の文字列に変換する。
     *
     * @returns
     * @throws Error QRコードの解析に失敗した場合。
     */
    async toString() {
        if (typeof this.contentOrImageData === "string") {
            return this.contentOrImageData;
        }
        else {
            let buffer = this.contentOrImageData;
            if (buffer instanceof ByteArray) {
                buffer = Buffer.from(buffer.uint8Array);
            }
            const { data, info } = await sharp(Buffer.from(buffer), { density: 300 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            const qrcode = jsQR.default(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height);
            if (qrcode === null) {
                throw new Error("Could not parse the QR code.");
            }
            else {
                return qrcode.data;
            }
        }
    }
    /**
     * QRコードの画像データをバイト配列に変換する。
     *
     * @param type ファイル形式。デフォルトは"svg"。
     * @returns
     */
    async toByteArray(type = "svg") {
        return new Promise((resolve, reject) => {
            if (typeof this.contentOrImageData === "string") {
                switch (type) {
                    case "svg":
                        nodeQrcode.toString(this.contentOrImageData, { type: type }, (error, result) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                resolve(ByteArray.from(Buffer.from(result)));
                            }
                        });
                        break;
                    case "png":
                        nodeQrcode.toBuffer(this.contentOrImageData, { type: type }, (error, buffer) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                resolve(ByteArray.from(buffer));
                            }
                        });
                        break;
                    default:
                        reject(new Error("Unsupported image data."));
                        break;
                }
            }
            else {
                if (this.contentOrImageData instanceof ByteArray) {
                    resolve(this.contentOrImageData);
                }
                else {
                    resolve(ByteArray.from(this.contentOrImageData));
                }
            }
        });
    }
}
