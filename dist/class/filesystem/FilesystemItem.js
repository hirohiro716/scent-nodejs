import fs from "fs";
import path from "path";
/**
 * ファイルシステムアイテムの抽象クラス。
 */
export default class FilesystemItem {
    /**
     * コンストラクタ。ファイルシステムアイテムのパスを指定する。
     *
     * @param path
     */
    constructor(path) {
        this._path = path;
    }
    /**
     * ファイルシステムアイテムの抽象パスを取得する。コンストラクタで相対パスを渡している場合は戻り値も相対パスになる。
     *
     * @returns
     */
    get path() {
        return this._path;
    }
    /**
     * ファイルシステムアイテムの抽象パスをセットする。
     */
    set path(path) {
        this._path = path;
    }
    /**
     * ファイルシステムアイテムの名前のみを取得する。
     *
     * @returns
     */
    getName() {
        return path.basename(this._path);
    }
    /**
     * ファイルシステムアイテムの絶対パスを取得する。
     * "."や".."などの短縮形または冗長な名前の解決も行う。
     *
     * @returns
     */
    getAbsolutePath() {
        return path.resolve(this._path);
    }
    /**
     * ファイルシステムに指定されたパスのファイルが存在する場合はtrueを返す。
     *
     * @param filePath
     */
    static hasFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.stat(filePath, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stats.isFile());
            });
        });
    }
    /**
     * ファイルシステムアイテムがファイルの場合にtrueを返す。
     *
     * @returns
     */
    isFile() {
        return FilesystemItem.hasFile(this._path);
    }
    /**
     * ファイルシステムに指定されたパスのディレクトリが存在する場合はtrueを返す。
     *
     * @param directoryPath
     */
    static hasDirectory(directoryPath) {
        return new Promise((resolve, reject) => {
            fs.stat(directoryPath, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stats.isDirectory());
            });
        });
    }
    /**
     * ファイルシステムアイテムがディレクトリの場合にtrueを返す。
     *
     * @returns
     */
    isDirectory() {
        return FilesystemItem.hasDirectory(this._path);
    }
    /**
     * ファイルシステムアイテムにアクセスする。
     *
     * @returns
     */
    access() {
        return new Promise((resolve, reject) => {
            fs.promises.access(this._path).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }
    /**
     * ファイルシステムアイテムの親ディレクトリパスを取得する。
     *
     * @returns
     */
    getParentDirectoryPath() {
        return path.dirname(this._path);
    }
    /**
     * ファイルシステムパスの区切り文字を取得する。
     *
     * @returns
     */
    static getFileSeparator() {
        return path.sep;
    }
}
