import * as nodeQrcode from "qrcode";
import { ByteArray } from "scent-typescript";
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
            let buffer;
            if (this.contentOrImageData instanceof Buffer) {
                buffer = this.contentOrImageData;
            }
            else {
                buffer = this.contentOrImageData.toBuffer();
            }
            const sharp = require("sharp");
            const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            const jsQR = require("jsqr");
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
                }
            }
            else {
                if (this.contentOrImageData instanceof Buffer) {
                    resolve(ByteArray.from(this.contentOrImageData));
                }
                else if (this.contentOrImageData instanceof ByteArray) {
                    resolve(this.contentOrImageData);
                }
            }
        });
    }
}
