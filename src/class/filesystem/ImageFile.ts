import { Readable } from "stream";
import sharp from "sharp";
import File from "./File.js";
import { ByteArray, Dimension } from "scent-typescript";

type FormatType = "jpg" | "png" | "gif" | "webp";

export default class ImageFile extends File {

    /**
     * この画像を変更したストリームを取得する。
     * 
     * @param format 
     * @param qualityPercentage
     * @param maximumLongSide
     * @returns
     */
    public change({format, qualityPercentage, resizeLongSide: resizeLongSide}: {format?: FormatType, qualityPercentage?: number, resizeLongSide?: number}): Promise<Readable> {
        return new Promise<Readable>((resolve, reject) => {
            let sharpInstance = sharp(this.getAbsolutePath());
            sharpInstance.metadata().then((meta) => {
                if (format) {
                    sharpInstance = sharpInstance.toFormat(format, {quality: qualityPercentage});
                } else if (meta.format) {
                    sharpInstance = sharpInstance.toFormat(meta.format, {quality: qualityPercentage});
                }
                if (resizeLongSide) {
                    sharpInstance = sharpInstance.resize({ width: resizeLongSide, height: resizeLongSide, fit: "inside"});
                }
                resolve(sharpInstance);
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    /**
     * この画像の幅と高さを取得する。
     * 
     * @returns 
     */
    public getImageSize(): Promise<Dimension> {
        return ImageFile.getImageSizeFrom(this.getAbsolutePath());
    }

    /**
     * 指定された画像の幅と高さを取得する。
     * 
     * @param imagePathOrBuffer 
     * @returns 
     */
    public static getImageSizeFrom(imagePathOrBuffer: string | Buffer | ByteArray): Promise<Dimension> {
        return new Promise<{width: number, height: number}>(async (resolve, reject) => {
            let sharpInstance;
            if (imagePathOrBuffer instanceof ByteArray) {
                sharpInstance = sharp(await imagePathOrBuffer.toBuffer());
            } else {
                sharpInstance = sharp(imagePathOrBuffer);
            }
            sharpInstance.metadata().then((meta) => {
                if (meta.width && meta.height) {
                    resolve({width: meta.width, height: meta.height});
                } else {
                    reject(new Error("The image size could not be read."));
                }
            }).catch((error: any) => {
                reject(error);
            });
        });
    }
}
