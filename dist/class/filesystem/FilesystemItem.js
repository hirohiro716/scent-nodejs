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
     * ファイルシステムアイテムにファイルとしてアクセス可能な場合にtrueを返す。
     *
     * @returns
     */
    async isFileAccessible() {
        try {
            const stats = await fs.promises.stat(this._path);
            return stats.isFile();
        }
        catch (error) {
            return false;
        }
    }
    /**
     * ファイルシステムアイテムにディレクトリとしてアクセス可能な場合にtrueを返す。
     *
     * @returns
     */
    async isDirectoryAccessible() {
        try {
            const stats = await fs.promises.stat(this._path);
            return stats.isDirectory();
        }
        catch (error) {
            return false;
        }
    }
    /**
     * ファイルシステムアイテムにアクセスする。
     */
    async access() {
        await fs.promises.access(this._path);
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
