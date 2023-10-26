import fs from "fs";
import path from "path";

/**
 * ファイルシステムアイテムの抽象クラス。
 */
export default abstract class FilesystemItem {

    /**
     * コンストラクタ。ファイルシステムアイテムのパスを指定する。
     * 
     * @param path 
     */
    public constructor(path: string) {
        this._path = path;
    }

    private _path: string;

    /**
     * ファイルシステムアイテムの抽象パスを取得する。コンストラクタで相対パスを渡している場合は戻り値も相対パスになる。
     * 
     * @returns 
     */
    public get path(): string {
        return this._path;
    }

    /**
     * ファイルシステムアイテムの抽象パスをセットする。
     */
    protected set path(path: string) {
        this._path = path;
    }

    /**
     * ファイルシステムアイテムの名前のみを取得する。
     * 
     * @returns 
     */
    public getName(): string {
        return path.basename(this._path);
    }

    /**
     * ファイルシステムアイテムの絶対パスを取得する。
     * "."や".."などの短縮形または冗長な名前の解決も行う。
     * 
     * @returns 
     */
    public getAbsolutePath(): string {
        return path.resolve(this._path);
    }

    /**
     * ファイルシステムに指定されたパスのファイルが存在する場合はtrueを返す。
     * 
     * @param filePath 
     */
    public static hasFile(filePath: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
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
    public isFile(): Promise<boolean> {
        return FilesystemItem.hasFile(this._path);
    }

    /**
     * ファイルシステムに指定されたパスのディレクトリが存在する場合はtrueを返す。
     * 
     * @param directoryPath 
     */
    public static hasDirectory(directoryPath: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
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
    public isDirectory(): Promise<boolean> {
        return FilesystemItem.hasDirectory(this._path);
    }

    /**
     * ファイルシステムアイテムにアクセスする。
     * 
     * @returns 
     */
    public access(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.promises.access(this._path).then(() => {
                resolve();
            }).catch((error: any) => {
                reject(error);
            });
        });
    }

    /**
     * ファイルシステムアイテムの親ディレクトリパスを取得する。
     * 
     * @returns 
     */
    protected getParentDirectoryPath(): string {
        return path.dirname(this._path);
    }

    /**
     * ファイルシステムアイテムを新規作成する。
     * 
     * @returns
     */
    public abstract create(): Promise<void>;

    /**
     * ファイルシステムアイテムを削除する。
     * 
     * @returns
     */
    public abstract delete(): Promise<void>;

    /**
     * ファイルシステムアイテムを指定されたパスに移動する。
     * 
     * @param destination
     * @returns
     */
    public abstract move(destination: string): Promise<void>;

    /**
     * ファイルシステムアイテムを指定されたパスにコピーする。
     * 
     * @param destination
     * @returns
     */
    public abstract copy(destination: string): Promise<FilesystemItem>;

    /**
     * ファイルシステムアイテムの親ディレクトリを取得する。
     * 
     * @returns 
     */
    public abstract getParentDirectory(): any;

    /**
     * ファイルシステムパスの区切り文字を取得する。
     * 
     * @returns 
     */
    public static getFileSeparator(): string {
        return path.sep;
    }
}
