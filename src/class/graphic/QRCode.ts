import * as nodeQrcode from "qrcode";
import { ByteArray } from "scent-typescript";
import jsQR from "jsqr";
import sharp from "sharp";

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
    public constructor(contentOrImageData: string | Buffer | ByteArray) {
        this.contentOrImageData = contentOrImageData;
    }

    private readonly contentOrImageData: string | Buffer | ByteArray;

    /**
     * QRコードを内容の文字列に変換する。
     * 
     * @returns 
     * @throws Error QRコードの解析に失敗した場合。
     */
    public async toString(): Promise<string> {
        if (typeof this.contentOrImageData === "string") {
            return this.contentOrImageData;
        } else {
            let buffer: Buffer;
            if (this.contentOrImageData instanceof Buffer) {
                buffer = this.contentOrImageData;
            } else {
                buffer = this.contentOrImageData.toBuffer();
            }
            const {data, info} = await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject: true});
            const qrcode = jsQR(new Uint8ClampedArray(data.buffer), info.width, info.height);
            if (qrcode === null) {
                throw new Error("Could not parse the QR code.");
            } else {
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
    public async toByteArray(type: Type = "svg"): Promise<ByteArray> {
        return new Promise<ByteArray>((resolve, reject) => {
            if (typeof this.contentOrImageData === "string") {
                switch (type) {
                    case "svg":
                        nodeQrcode.toString(this.contentOrImageData, {type: type}, (error: any, result: string) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(ByteArray.from(Buffer.from(result)));
                            }
                        });
                        break;
                    case "png":
                        nodeQrcode.toBuffer(this.contentOrImageData, {type: type}, (error: any, buffer: Buffer) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(ByteArray.from(buffer));
                            }
                        });
                        break;
                }
            } else {
                if (this.contentOrImageData instanceof Buffer) {
                    resolve(ByteArray.from(this.contentOrImageData));
                } else if (this.contentOrImageData instanceof ByteArray) {
                    resolve(this.contentOrImageData); 
                }
            }
        });
    }
}
