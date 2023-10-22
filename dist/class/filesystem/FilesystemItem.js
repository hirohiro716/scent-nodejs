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
     *
     * @returns
     */
    getAbsolutePath() {
        return path.resolve(this._path);
    }
    /**
     * ファイルシステムアイテムがファイルの場合にtrueを返す。
     *
     * @returns
     */
    isFile() {
        return new Promise((resolve, reject) => {
            fs.stat(this._path, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stats.isFile());
            });
        });
    }
    /**
     * ファイルシステムアイテムがディレクトリの場合にtrueを返す。
     *
     * @returns
     */
    isDirectory() {
        return new Promise((resolve, reject) => {
            fs.stat(this._path, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stats.isDirectory());
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
     * ファイルシステムパスの区切り文字を取得する。
     *
     * @returns
     */
    static getFileSeparator() {
        return path.sep;
    }
}
