import File from "./File.js";
import { ByteArray } from "scent-typescript";
export default class ImageFile extends File {
    /**
     * この画像を変更したストリームを取得する。
     *
     * @param format
     * @param qualityPercentage
     * @param maximumLongSide
     * @returns
     */
    async change({ format, qualityPercentage, resizeLongSide: resizeLongSide }) {
        const sharp = require("sharp");
        let sharpInstance = sharp(this.getAbsolutePath());
        const meta = await sharpInstance.metadata();
        if (format) {
            sharpInstance = sharpInstance.toFormat(format, { quality: qualityPercentage });
        }
        else if (meta.format) {
            sharpInstance = sharpInstance.toFormat(meta.format, { quality: qualityPercentage });
        }
        if (resizeLongSide) {
            sharpInstance = sharpInstance.resize({ width: resizeLongSide, height: resizeLongSide, fit: "inside" });
        }
        return sharpInstance;
    }
    /**
     * この画像の幅と高さを取得する。
     *
     * @returns
     */
    getImageSize() {
        return ImageFile.getImageSizeFrom(this.getAbsolutePath());
    }
    /**
     * 指定された画像の幅と高さを取得する。
     *
     * @param imagePathOrBuffer
     * @returns
     * @throws Error 画像の読み取りに失敗した場合。
     */
    static async getImageSizeFrom(imagePathOrBuffer) {
        const sharp = require("sharp");
        let sharpInstance;
        if (imagePathOrBuffer instanceof ByteArray) {
            sharpInstance = sharp(await imagePathOrBuffer.toBuffer());
        }
        else {
            sharpInstance = sharp(imagePathOrBuffer);
        }
        const meta = await sharpInstance.metadata();
        if (meta.width && meta.height) {
            return { width: meta.width, height: meta.height };
        }
        else {
            throw new Error("The image size could not be read.");
        }
    }
}
