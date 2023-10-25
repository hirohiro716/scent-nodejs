import { Readable, Writable } from "stream";
import FilesystemItem from "./FilesystemItem.js";
import fs from "fs";
import Directory from "./Directory.js";
import { StringObject } from "scent-typescript";

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
    public create(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(this.path, "", (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        })
    }
    
    /**
     * ファイルを削除する。
     * 
     * @returns 
     */
    public delete(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
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
    public move(destination: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
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
    public copy(destination: string): Promise<FilesystemItem> {
        return new Promise<File>((resolve, reject) => {
            fs.cp(this.path, destination, { force: true}, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(new File(destination));
            })
        });
    }

    /**
     * ファイルサイズを取得する。
     * 
     * @returns 
     */
    public getSize(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
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
     * @param bufferEncoding エンコーディング。
     * @param highWaterMark バッファの容量の制限。
     * @returns 
     */
    public createReadStream(bufferEncoding?: BufferEncoding, highWaterMark?: number): Readable {
        const options = { bufferEncoding: bufferEncoding, highWaterMark: highWaterMark };
        return fs.createReadStream(this.path, options);
    }

    /**
     * このファイルに書き込みできるStreamを作成する。
     * 
     * @param bufferEncoding エンコーディング。
     * @param highWaterMark バッファの容量の制限。
     * @returns 
     */
    public createWriteStream(bufferEncoding?: BufferEncoding, highWaterMark?: number): Writable {
        const options = { bufferEncoding: bufferEncoding, highWaterMark: highWaterMark };
        return fs.createWriteStream(this.path, options);
    }
}