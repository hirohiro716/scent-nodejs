import { Readable, Writable } from "stream";
import FilesystemItem from "./FilesystemItem.js";
import Directory from "./Directory.js";
import { ByteArray } from "scent-typescript";
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
     */
    create(): Promise<void>;
    /**
     * ファイルを削除する。
     */
    delete(): Promise<void>;
    /**
     * ファイルを移動する。
     *
     * @param destination
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
     * ファイルの親ディレクトリを取得する。
     *
     * @returns
     */
    getParentDirectory(): Directory;
    /**
     * ファイルサイズを取得する。
     *
     * @returns
     */
    getSize(): Promise<number>;
    /**
     * このファイルを読み取りできるStreamを作成する。
     *
     * @param highWaterMark バッファの容量の制限。
     * @param bufferEncoding テキストを処理する場合のエンコーディング。
     * @returns
     */
    createReadStream(highWaterMark?: number, bufferEncoding?: BufferEncoding): Readable;
    /**
     * このファイルに書き込みできるStreamを作成する。
     *
     * @param highWaterMark バッファの容量の制限。
     * @param bufferEncoding テキストを処理する場合のエンコーディング。
     * @returns
     */
    createWriteStream(highWaterMark?: number, bufferEncoding?: BufferEncoding): Writable;
    /**
     * このファイルのバイト配列を作成する。
     *
     * @param highWaterMark
     * @returns
     */
    createByteArray(highWaterMark?: number): Promise<ByteArray>;
    /**
     * このファイルに指定されたバイト配列を書き込む。
     *
     * @param byteArray
     * @param highWaterMark
     */
    writeByteArray(byteArray: ByteArray, highWaterMark?: number): Promise<void>;
}
