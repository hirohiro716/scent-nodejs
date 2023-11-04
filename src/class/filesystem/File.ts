import { Readable, Writable } from "stream";
import FilesystemItem from "./FilesystemItem.js";
import fs from "fs";
import Directory from "./Directory.js";
import { ByteArray, StringObject } from "scent-typescript";

/**
 * ファイルのクラス。
 */
export default class File extends FilesystemItem {
    
    /**
     * コンストラクタ。ファイルのパスを指定する。
     * 
     * @param path 
     */
    public constructor(path: string);

    /**
     * コンストラクタ。ファイルの名前、親ディレクトリを指定する。
     * 
     * @param path 
     */
    public constructor(fileName: string, parentDirectory: Directory);

    /**
     * @deprecated
     */
    public constructor(parameter1: string, parameter2?: Directory) {
        if (typeof parameter2 !== "undefined") {
            const path = new StringObject(parameter2.path);
            if (path.toString().endsWith(FilesystemItem.getFileSeparator()) === false) {
                path.append(FilesystemItem.getFileSeparator());
            }
            path.append(parameter1);
            super(path.toString());
        } else {
            super(String(parameter1));
        }
    }

    /**
     * ファイルを新規作成する。
     * 
     * @returns 
     */
    public async create(): Promise<void> {
        await fs.promises.writeFile(this.path, "");
    }
    
    /**
     * ファイルを削除する。
     * 
     * @returns 
     */
    public async delete(): Promise<void> {
        await fs.promises.rm(this.path, { force: true });
    }

    /**
     * ファイルを移動する。
     * 
     * @param destination 
     * @returns 
     */
    public async move(destination: string): Promise<void> {
        await fs.promises.rename(this.path, destination);
        this.path = destination;
    }

    /**
     * ファイルをコピーする。
     * 
     * @param destination 
     * @returns 
     */
    public async copy(destination: string): Promise<FilesystemItem> {
        await fs.promises.cp(this.path, destination, { force: true});
        return new File(destination);
    }

    /**
     * ファイルの親ディレクトリを取得する。
     * 
     * @returns 
     */
    public getParentDirectory(): Directory {
        return new Directory(super.getParentDirectoryPath());
    }

    /**
     * ファイルサイズを取得する。
     * 
     * @returns 
     */
    public async getSize(): Promise<number> {
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
    public createReadStream(highWaterMark?: number, bufferEncoding?: BufferEncoding): Readable {
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
    public createWriteStream(highWaterMark?: number, bufferEncoding?: BufferEncoding): Writable {
        const options = { bufferEncoding: bufferEncoding, highWaterMark: highWaterMark };
        return fs.createWriteStream(this.path, options);
    }

    /**
     * このファイルのバイト配列を作成する。
     * 
     * @param highWaterMark 
     * @returns 
     */
    public createByteArray(highWaterMark?: number): Promise<ByteArray> {
        return new Promise<ByteArray>((resolve, reject) => {
            const blobParts: BlobPart[] = [];
            const readable = this.createReadStream(highWaterMark);
            readable.on("end", () => {
                resolve(ByteArray.from(new Blob(blobParts)));
            });
            readable.on("error", (error: any) => {
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
    public writeByteArray(byteArray: ByteArray, highWaterMark?: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const writable = this.createWriteStream(highWaterMark);
            byteArray.toUnit8Array().then((unit8Array) => {
                const result = writable.write(unit8Array, (error: any) => {
                    if (error) {
                        reject(error);
                    }
                });
                if (result) {
                    resolve();
                }
            }).catch((error:any) => {
                reject(error);
            });
        });
    }
}
