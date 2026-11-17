import { Readable } from "stream";
import File from "./File.js";
import { ByteArray } from "scent-typescript";
import Directory from "./Directory.js";
import sharp from "sharp";
import { pipeline } from "stream/promises";
/**
 * 画像ファイルのクラス。
 */
export default class ImageFile extends File {
    /**
     * 指定された画像のバッファやストリームを変更した新たなストリームを取得する。
     *
     * @param inputBuffer
     * @param changeType
     * @returns
     */
    static async changeBuffer(inputBuffer, changeType) {
        let sharpInstance = sharp(inputBuffer);
        const meta = await sharpInstance.metadata();
        if (changeType.format) {
            sharpInstance = sharpInstance.toFormat(changeType.format === "jpg" ? "jpeg" : changeType.format, { quality: changeType.qualityPercentage });
        }
        else if (meta.format) {
            sharpInstance = sharpInstance.toFormat(meta.format, { quality: changeType.qualityPercentage });
        }
        if (changeType.resizeLongSide) {
            sharpInstance = sharpInstance.resize({ width: changeType.resizeLongSide, height: changeType.resizeLongSide, fit: "inside" });
        }
        return sharpInstance;
    }
    /**
     * この画像を変更したストリームを取得する。
     *
     * @param changeType
     * @returns
     */
    async change(changeType) {
        const byteArray = await this.createByteArray();
        return await ImageFile.changeBuffer(Buffer.from(byteArray.uint8Array), changeType);
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
     * @deprecated
     */
    static async from(parameter1, parameter2, parameter3, parameter4) {
        let file;
        let inputBuffer;
        let changeType;
        if (parameter2 instanceof Directory) {
            file = new ImageFile(parameter1, parameter2);
            inputBuffer = parameter3;
            changeType = parameter4;
        }
        else {
            file = new ImageFile(parameter1);
            inputBuffer = parameter2;
            changeType = parameter3;
        }
        if (typeof changeType === "undefined") {
            await pipeline(Readable.from(inputBuffer), file.createWriteStream());
        }
        else {
            const readable = await ImageFile.changeBuffer(inputBuffer, changeType);
            await pipeline(readable, file.createWriteStream());
        }
        return file;
    }
    /**
     * 指定された画像の幅と高さを取得する。
     *
     * @param imagePathOrBuffer
     * @returns
     * @throws Error 画像の読み取りに失敗した場合。
     */
    static async getImageSizeFrom(imagePathOrBuffer) {
        let sharpInstance;
        if (imagePathOrBuffer instanceof ByteArray) {
            sharpInstance = sharp(imagePathOrBuffer.uint8Array);
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
