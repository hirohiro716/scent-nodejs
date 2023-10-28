import sharp from "sharp";
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
    change({ format, qualityPercentage, resizeLongSide: resizeLongSide }) {
        return new Promise((resolve, reject) => {
            let sharpInstance = sharp(this.getAbsolutePath());
            sharpInstance.metadata().then((meta) => {
                if (format) {
                    sharpInstance = sharpInstance.toFormat(format, { quality: qualityPercentage });
                }
                else if (meta.format) {
                    sharpInstance = sharpInstance.toFormat(meta.format, { quality: qualityPercentage });
                }
                if (resizeLongSide) {
                    sharpInstance = sharpInstance.resize({ width: resizeLongSide, height: resizeLongSide, fit: "inside" });
                }
                resolve(sharpInstance);
            }).catch((error) => {
                reject(error);
            });
        });
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
     */
    static getImageSizeFrom(imagePathOrBuffer) {
        return new Promise(async (resolve, reject) => {
            let sharpInstance;
            if (imagePathOrBuffer instanceof ByteArray) {
                sharpInstance = sharp(await imagePathOrBuffer.toBuffer());
            }
            else {
                sharpInstance = sharp(imagePathOrBuffer);
            }
            sharpInstance.metadata().then((meta) => {
                if (meta.width && meta.height) {
                    resolve({ width: meta.width, height: meta.height });
                }
                else {
                    reject(new Error("The image size could not be read."));
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
