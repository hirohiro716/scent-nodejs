import { Readable } from "stream";
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
     * QRコードをデコードして内容を取得する。
     * 
     * @returns 
     */
    public decode(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            if (typeof this.contentOrImageData === "string") {
                resolve(this.contentOrImageData);
            } else {
                try {
                    let buffer: Buffer;
                    if (this.contentOrImageData instanceof Buffer) {
                        buffer = this.contentOrImageData;
                    } else {
                        buffer = await this.contentOrImageData.toBuffer();
                    }
                    const {data, info} = await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject: true});
                    const qrcode = jsQR(new Uint8ClampedArray(data.buffer), info.width, info.height);
                    if (qrcode === null) {
                        reject(new Error("Could not parse the QR code."));
                    } else {
                        resolve(qrcode.data);
                    }
                } catch (error: any) {
                    reject(error);
                }
            }
        });
    }

    /**
     * QRコードの画像を読み込むストリームを作成する。
     * 
     * @param type ファイル形式。デフォルトは"svg"。
     * @param highWaterMark バッファの容量の制限。
     * @returns 
     */
    public createReadStream(type: Type = "svg", highWaterMark?: number): Promise<Readable> {
        return new Promise<Readable>((resolve, reject) => {
            if (typeof this.contentOrImageData === "string") {
                switch (type) {
                    case "svg":
                        nodeQrcode.toString(this.contentOrImageData, {type: type}, (error: any, result: string) => {
                            if (error) {
                                reject(error);
                            } else {
                                const buffer = Buffer.from(result);
                                const readable = new Readable();
                                readable.push(buffer);
                                readable.push(null);
                                resolve(readable);
                            }
                        });
                        break;
                    case "png":
                        nodeQrcode.toBuffer(this.contentOrImageData, {type: type}, (error: any, buffer: Buffer) => {
                            if (error) {
                                reject(error);
                            } else {
                                const readable = new Readable();
                                readable.push(buffer);
                                readable.push(null);
                                resolve(readable);
                            }
                        });
                        break;
                }
            } else {
                const readable = new Readable();
                if (this.contentOrImageData instanceof Buffer) {
                    readable.push(this.contentOrImageData);
                    readable.push(null);
                    resolve(readable);
                } else if (this.contentOrImageData instanceof ByteArray) {
                    this.contentOrImageData.toBuffer().then((buffer) => {
                        readable.push(buffer);
                        readable.push(null);
                        resolve(readable);
                    }).catch((error: any) => {
                        reject(error);
                    });
                }
            }
        });
    }
}
