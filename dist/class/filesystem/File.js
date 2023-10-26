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
     *
     * @returns
     */
    create() {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.path, "", (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * ファイルを削除する。
     *
     * @returns
     */
    delete() {
        return new Promise((resolve, reject) => {
            fs.rm(this.path, { force: true }, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * ファイルを移動する。
     *
     * @param destination
     * @returns
     */
    move(destination) {
        return new Promise((resolve, reject) => {
            fs.rename(this.path, destination, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                this.path = destination;
                resolve();
            });
        });
    }
    /**
     * ファイルをコピーする。
     *
     * @param destination
     * @returns
     */
    copy(destination) {
        return new Promise((resolve, reject) => {
            fs.cp(this.path, destination, { force: true }, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(new File(destination));
            });
        });
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
    getSize() {
        return new Promise((resolve, reject) => {
            fs.stat(this.path, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stats.size);
            });
        });
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
            byteArray.toUnit8Array().then((unit8Array) => {
                writable.write(unit8Array, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
