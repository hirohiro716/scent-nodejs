/**
 * ファイルシステムアイテムの抽象クラス。
 */
export default abstract class FilesystemItem {
    /**
     * コンストラクタ。ファイルシステムアイテムのパスを指定する。
     *
     * @param path
     */
    constructor(path: string);
    private _path;
    /**
     * ファイルシステムアイテムの抽象パスを取得する。コンストラクタで相対パスを渡している場合は戻り値も相対パスになる。
     *
     * @returns
     */
    get path(): string;
    /**
     * ファイルシステムアイテムの抽象パスをセットする。
     */
    protected set path(path: string);
    /**
     * ファイルシステムアイテムの名前のみを取得する。
     *
     * @returns
     */
    getName(): string;
    /**
     * ファイルシステムアイテムの絶対パスを取得する。
     *
     * @returns
     */
    getAbsolutePath(): string;
    /**
     * ファイルシステムアイテムがファイルの場合にtrueを返す。
     *
     * @returns
     */
    isFile(): Promise<boolean>;
    /**
     * ファイルシステムアイテムがディレクトリの場合にtrueを返す。
     *
     * @returns
     */
    isDirectory(): Promise<boolean>;
    /**
     * ファイルシステムアイテムの親ディレクトリパスを取得する。
     *
     * @returns
     */
    getParentDirectoryPath(): string;
    /**
     * ファイルシステムアイテムにアクセスする。
     *
     * @returns
     */
    access(): Promise<void>;
    /**
     * ファイルシステムアイテムを新規作成する。
     *
     * @returns
     */
    abstract create(): Promise<void>;
    /**
     * ファイルシステムアイテムを削除する。
     *
     * @returns
     */
    abstract delete(): Promise<void>;
    /**
     * ファイルシステムアイテムを指定されたパスに移動する。
     *
     * @param destination
     * @returns
     */
    abstract move(destination: string): Promise<void>;
    /**
     * ファイルシステムアイテムを指定されたパスにコピーする。
     *
     * @param destination
     * @returns
     */
    abstract copy(destination: string): Promise<FilesystemItem>;
    /**
     * ファイルシステムパスの区切り文字を取得する。
     *
     * @returns
     */
    static getFileSeparator(): string;
}
