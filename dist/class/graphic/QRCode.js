import { Readable } from "stream";
import * as nodeQrcode from "qrcode";
import { ByteArray } from "scent-typescript";
import jsQR from "jsqr";
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
     * QRコードをデコードして内容を取得する。
     *
     * @returns
     * @throws Error QRコードの解析に失敗した場合。
     */
    async decode() {
        if (typeof this.contentOrImageData === "string") {
            return this.contentOrImageData;
        }
        else {
            let buffer;
            if (this.contentOrImageData instanceof Buffer) {
                buffer = this.contentOrImageData;
            }
            else {
                buffer = await this.contentOrImageData.toBuffer();
            }
            const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            const qrcode = jsQR(new Uint8ClampedArray(data.buffer), info.width, info.height);
            if (qrcode === null) {
                throw new Error("Could not parse the QR code.");
            }
            else {
                return qrcode.data;
            }
        }
    }
    /**
     * QRコードの画像を読み込むストリームを作成する。
     *
     * @param type ファイル形式。デフォルトは"svg"。
     * @returns
     */
    async createReadStream(type = "svg") {
        return new Promise((resolve, reject) => {
            if (typeof this.contentOrImageData === "string") {
                switch (type) {
                    case "svg":
                        nodeQrcode.toString(this.contentOrImageData, { type: type }, (error, result) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                const buffer = Buffer.from(result);
                                const readable = new Readable();
                                readable.push(buffer);
                                readable.push(null);
                                resolve(readable);
                            }
                        });
                        break;
                    case "png":
                        nodeQrcode.toBuffer(this.contentOrImageData, { type: type }, (error, buffer) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                const readable = new Readable();
                                readable.push(buffer);
                                readable.push(null);
                                resolve(readable);
                            }
                        });
                        break;
                }
            }
            else {
                const readable = new Readable();
                if (this.contentOrImageData instanceof Buffer) {
                    readable.push(this.contentOrImageData);
                    readable.push(null);
                    resolve(readable);
                }
                else if (this.contentOrImageData instanceof ByteArray) {
                    readable.push(this.contentOrImageData.toBuffer());
                    readable.push(null);
                    resolve(readable);
                }
            }
        });
    }
}
