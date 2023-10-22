/// <reference types="node" />
/// <reference types="node" />
import { Readable, Writable } from "stream";
import FilesystemItem from "./FilesystemItem.js";
import Directory from "./Directory.js";
/**
 * ファイルのクラス。
 */
export default class File extends FilesystemItem {
    /**
     * コンストラクタ。ファイルのパスを指定する。
     *
     * @param path
     */
    constructor(path: string);
    /**
     * コンストラクタ。ファイルの名前、親ディレクトリを指定する。
     *
     * @param path
     */
    constructor(fileName: string, parentDirectory: Directory);
    /**
     * ファイルを新規作成する。
     *
     * @returns
     */
    create(): Promise<void>;
    /**
     * ファイルを削除する。
     *
     * @returns
     */
    delete(): Promise<void>;
    /**
     * ファイルを移動する。
     *
     * @param destination
     * @returns
     */
    move(destination: string): Promise<void>;
    /**
     * ファイルをコピーする。
     *
     * @param destination
     * @returns
     */
    copy(destination: string): Promise<FilesystemItem>;
    /**
     * ファイルサイズを取得する。
     *
     * @returns
     */
    getSize(): Promise<number>;
    /**
     * このファイルを読み取りできるStreamを作成する。
     *
     * @param bufferEncoding エンコーディング。
     * @param highWaterMark バッファの容量の制限。
     * @returns
     */
    createReadStream(bufferEncoding?: BufferEncoding, highWaterMark?: number): Readable;
    /**
     * このファイルに書き込みできるStreamを作成する。
     *
     * @param bufferEncoding エンコーディング。
     * @param highWaterMark バッファの容量の制限。
     * @returns
     */
    createWriteStream(bufferEncoding?: BufferEncoding, highWaterMark?: number): Writable;
}
