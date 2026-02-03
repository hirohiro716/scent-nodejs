import File from "./File.js";
import { ByteArray } from "scent-typescript";
import Directory from "./Directory.js";
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
        const sharp = require("sharp");
        let sharpInstance = sharp(inputBuffer);
        const meta = await sharpInstance.metadata();
        if (changeType.format) {
            sharpInstance = sharpInstance.toFormat(changeType.format, { quality: changeType.qualityPercentage });
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
        return await ImageFile.changeBuffer(byteArray.toBuffer(), changeType);
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
        let inputBuffer;
        if (parameter2 instanceof Buffer) {
            inputBuffer = parameter2;
        }
        if (parameter3 instanceof Buffer) {
            inputBuffer = parameter3;
        }
        if (typeof inputBuffer === "undefined") {
            if (parameter2 instanceof Directory) {
                return new ImageFile(parameter1, parameter2);
            }
            else {
                return new ImageFile(parameter1);
            }
        }
        else {
            let imageFile;
            if (parameter2 instanceof Directory) {
                imageFile = new ImageFile(parameter1, parameter2);
            }
            else {
                imageFile = new ImageFile(parameter1);
            }
            let changeType;
            if (parameter3 instanceof Object) {
                changeType = parameter3;
            }
            if (parameter4 instanceof Object) {
                changeType = parameter4;
            }
            if (changeType) {
                const readable = await ImageFile.changeBuffer(inputBuffer, changeType);
                readable.pipe(imageFile.createWriteStream());
            }
            return imageFile;
        }
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
            sharpInstance = sharp(imagePathOrBuffer.toBuffer());
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
