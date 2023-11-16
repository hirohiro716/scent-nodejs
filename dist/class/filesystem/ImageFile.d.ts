/// <reference types="node" />
/// <reference types="node" />
import { Readable } from "stream";
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
    change({ format, qualityPercentage, resizeLongSide: resizeLongSide }: {
        format?: FormatType;
        qualityPercentage?: number;
        resizeLongSide?: number;
    }): Promise<Readable>;
    /**
     * この画像の幅と高さを取得する。
     *
     * @returns
     */
    getImageSize(): Promise<Dimension>;
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
