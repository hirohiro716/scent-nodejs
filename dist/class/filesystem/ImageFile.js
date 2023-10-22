import sharp from "sharp";
import File from "./File.js";
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
}
