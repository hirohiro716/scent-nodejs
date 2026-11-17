import { Readable } from "stream";
import File from "./File.js";
import { ByteArray, Dimension } from "scent-typescript";
import Directory from "./Directory.js";
import sharp from "sharp";
import { pipeline } from "stream/promises";

/**
 * 画像変更タイプ。
 * 
 * @property format 画像フォーマット。
 * @property qualityPercentage 画質。
 * @property resizeLongSide リサイズする場合の長辺。
 */
type ChangeType = {format?: FormatType, qualityPercentage?: number, resizeLongSide?: number};

/**
 * 画像フォーマットタイプ。
 */
type FormatType = "jpg" | "png" | "gif" | "webp";

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
    public static async changeBuffer(inputBuffer: Buffer, changeType: ChangeType): Promise<Readable> {
        let sharpInstance = sharp(inputBuffer);
        const meta = await sharpInstance.metadata();
        if (changeType.format) {
            sharpInstance = sharpInstance.toFormat(changeType.format === "jpg" ? "jpeg" : changeType.format, {quality: changeType.qualityPercentage});
        } else if (meta.format) {
            sharpInstance = sharpInstance.toFormat(meta.format, {quality: changeType.qualityPercentage});
        }
        if (changeType.resizeLongSide) {
            sharpInstance = sharpInstance.resize({ width: changeType.resizeLongSide, height: changeType.resizeLongSide, fit: "inside"});
        }
        return sharpInstance;
    }

    /**
     * この画像を変更したストリームを取得する。
     * 
     * @param changeType 
     * @returns
     */
    public async change(changeType: ChangeType): Promise<Readable> {
        const byteArray = await this.createByteArray();
        return await ImageFile.changeBuffer(Buffer.from(byteArray.uint8Array), changeType);
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
     * 指定されたパスにバッファの画像ファイルを作成する。
     * 
     * @param fileName
     * @param directory
     * @param inputBuffer 
     * @param changeType 画像を変更する場合に指定する。
     */
    public static async from(fileName: string, directory: Directory, inputBuffer: Buffer, changeType?: ChangeType): Promise<ImageFile>;

    /**
     * 指定されたパスにバッファの画像ファイルを作成する。
     * 
     * @param path
     * @param inputBuffer 
     * @param changeType 画像を変更する場合に指定する。
     */
    public static async from(fileName: string, inputBuffer: Buffer, changeType?: ChangeType): Promise<ImageFile>;

    /**
     * @deprecated
     */
    public static async from(parameter1: string, parameter2: Directory | Buffer, parameter3?: Buffer | ChangeType, parameter4?: ChangeType): Promise<ImageFile> {
        let file: ImageFile;
        let inputBuffer: Buffer;
        let changeType: ChangeType | undefined;
        if (parameter2 instanceof Directory) {
            file = new ImageFile(parameter1, parameter2);
            inputBuffer = parameter3 as Buffer;
            changeType = parameter4;
        } else {
            file = new ImageFile(parameter1);
            inputBuffer = parameter2;
            changeType = parameter3 as ChangeType;
        }
        if (typeof changeType === "undefined") {
            await pipeline(Readable.from(inputBuffer), file.createWriteStream());
        } else {
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
    public static async getImageSizeFrom(imagePathOrBuffer: string | Buffer | ByteArray): Promise<Dimension> {
        let sharpInstance;
        if (imagePathOrBuffer instanceof ByteArray) {
            sharpInstance = sharp(imagePathOrBuffer.uint8Array);
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
