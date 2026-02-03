import { Readable } from "stream";
import File from "./File.js";
import { ByteArray, Dimension } from "scent-typescript";
import Directory from "./Directory.js";
/**
 * 画像変更タイプ。
 *
 * @property format 画像フォーマット。
 * @property qualityPercentage 画質。
 * @property resizeLongSide リサイズする場合の長辺。
 */
type ChangeType = {
    format?: FormatType;
    qualityPercentage?: number;
    resizeLongSide?: number;
};
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
    static changeBuffer(inputBuffer: Buffer, changeType: ChangeType): Promise<Readable>;
    /**
     * この画像を変更したストリームを取得する。
     *
     * @param changeType
     * @returns
     */
    change(changeType: ChangeType): Promise<Readable>;
    /**
     * この画像の幅と高さを取得する。
     *
     * @returns
     */
    getImageSize(): Promise<Dimension>;
    /**
     * 指定されたパスにバッファの画像ファイルを作成する。
     *
     * @param fileName
     * @param directory
     * @param inputBuffer
     * @param changeType 画像を変更する場合に指定する。
     */
    static from(fileName: string, directory?: Directory, inputBuffer?: Buffer, changeType?: ChangeType): Promise<ImageFile>;
    /**
     * 指定されたパスにバッファの画像ファイルを作成する。
     *
     * @param path
     * @param inputBuffer
     * @param changeType 画像を変更する場合に指定する。
     */
    static from(fileName: string, inputBuffer?: Buffer, changeType?: ChangeType): Promise<ImageFile>;
    /**
     * 指定された画像の幅と高さを取得する。
     *
     * @param imagePathOrBuffer
     * @returns
     * @throws Error 画像の読み取りに失敗した場合。
     */
    static getImageSizeFrom(imagePathOrBuffer: string | Buffer | ByteArray): Promise<Dimension>;
}
export {};
