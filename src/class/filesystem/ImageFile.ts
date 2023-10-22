import { Readable } from "stream";
import sharp from "sharp";
import File from "./File.js";

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
}
