import FilesystemItem from "./FilesystemItem.js";
import fs from "fs";
import Directory from "./Directory.js";
import { ByteArray, StringObject } from "scent-typescript";
/**
 * ファイルのクラス。
 */
export default class File extends FilesystemItem {
    /**
     * @deprecated
     */
    constructor(parameter1, parameter2) {
        if (typeof parameter2 !== "undefined") {
            const path = new StringObject(parameter2.path);
            if (path.toString().endsWith(FilesystemItem.getFileSeparator()) === false) {
                path.append(FilesystemItem.getFileSeparator());
            }
            path.append(parameter1);
            super(path.toString());
        }
        else {
            super(String(parameter1));
        }
    }
    /**
     * ファイルを新規作成する。
     */
    async create() {
        await fs.promises.writeFile(this.path, "");
    }
    /**
     * ファイルを削除する。
     */
    async delete() {
        await fs.promises.rm(this.path, { force: true });
    }
    /**
     * ファイルを移動する。
     *
     * @param destination
     */
    async move(destination) {
        await fs.promises.rename(this.path, destination);
        this.path = destination;
    }
    /**
     * ファイルをコピーする。
     *
     * @param destination
     * @returns
     */
    async copy(destination) {
        await fs.promises.cp(this.path, destination, { force: true });
        return new File(destination);
    }
    /**
     * ファイルの親ディレクトリを取得する。
     *
     * @returns
     */
    getParentDirectory() {
        return new Directory(super.getParentDirectoryPath());
    }
    /**
     * ファイルサイズを取得する。
     *
     * @returns
     */
    async getSize() {
        const stats = await fs.promises.stat(this.path);
        return stats.size;
    }
    /**
     * このファイルを読み取りできるStreamを作成する。
     *
     * @param highWaterMark バッファの容量の制限。
     * @param bufferEncoding テキストを処理する場合のエンコーディング。
     * @returns
     */
    createReadStream(highWaterMark, bufferEncoding) {
        const options = { bufferEncoding: bufferEncoding, highWaterMark: highWaterMark };
        return fs.createReadStream(this.path, options);
    }
    /**
     * このファイルに書き込みできるStreamを作成する。
     *
     * @param highWaterMark バッファの容量の制限。
     * @param bufferEncoding テキストを処理する場合のエンコーディング。
     * @returns
     */
    createWriteStream(highWaterMark, bufferEncoding) {
        const options = { bufferEncoding: bufferEncoding, highWaterMark: highWaterMark };
        return fs.createWriteStream(this.path, options);
    }
    /**
     * このファイルのバイト配列を作成する。
     *
     * @param highWaterMark
     * @returns
     */
    createByteArray(highWaterMark) {
        return new Promise((resolve, reject) => {
            const blobParts = [];
            const readable = this.createReadStream(highWaterMark);
            readable.on("end", () => {
                resolve(ByteArray.from(new Blob(blobParts)));
            });
            readable.on("error", (error) => {
                reject(error);
            });
            readable.on("data", (chunk) => {
                blobParts.push(chunk);
            });
        });
    }
    /**
     * このファイルに指定されたバイト配列を書き込む。
     *
     * @param byteArray
     * @param highWaterMark
     */
    writeByteArray(byteArray, highWaterMark) {
        return new Promise((resolve, reject) => {
            const writable = this.createWriteStream(highWaterMark);
            const result = writable.write(byteArray.uint8Array, (error) => {
                if (error) {
                    reject(error);
                }
            });
            if (result) {
                resolve();
            }
        });
    }
}
