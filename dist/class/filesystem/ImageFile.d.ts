/// <reference types="node" />
import { Readable } from "stream";
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
    change({ format, qualityPercentage, resizeLongSide: resizeLongSide }: {
        format?: FormatType;
        qualityPercentage?: number;
        resizeLongSide?: number;
    }): Promise<Readable>;
}
export {};
