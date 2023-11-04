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
    public async change({format, qualityPercentage, resizeLongSide: resizeLongSide}: {format?: FormatType, qualityPercentage?: number, resizeLongSide?: number}): Promise<Readable> {
        let sharpInstance = sharp(this.getAbsolutePath());
        const meta = await sharpInstance.metadata();
        if (format) {
            sharpInstance = sharpInstance.toFormat(format, {quality: qualityPercentage});
        } else if (meta.format) {
            sharpInstance = sharpInstance.toFormat(meta.format, {quality: qualityPercentage});
        }
        if (resizeLongSide) {
            sharpInstance = sharpInstance.resize({ width: resizeLongSide, height: resizeLongSide, fit: "inside"});
        }
        return sharpInstance;
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
    public static async getImageSizeFrom(imagePathOrBuffer: string | Buffer | ByteArray): Promise<Dimension> {
        let sharpInstance;
        if (imagePathOrBuffer instanceof ByteArray) {
            sharpInstance = sharp(await imagePathOrBuffer.toBuffer());
        } else {
            sharpInstance = sharp(imagePathOrBuffer);
        }
        const meta = await sharpInstance.metadata();
        if (meta.width && meta.height) {
            return {width: meta.width, height: meta.height};
        } else {
            throw new Error("The image size could not be read.");
        }
    }
}
