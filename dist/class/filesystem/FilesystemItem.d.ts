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
     * "."や".."などの短縮形または冗長な名前の解決も行う。
     *
     * @returns
     */
    getAbsolutePath(): string;
    /**
     * ファイルシステムアイテムにファイルとしてアクセス可能な場合にtrueを返す。
     *
     * @returns
     */
    isFileAccessible(): Promise<boolean>;
    /**
     * ファイルシステムアイテムにディレクトリとしてアクセス可能な場合にtrueを返す。
     *
     * @returns
     */
    isDirectoryAccessible(): Promise<boolean>;
    /**
     * ファイルシステムアイテムにアクセスする。
     */
    access(): Promise<void>;
    /**
     * ファイルシステムアイテムの親ディレクトリパスを取得する。
     *
     * @returns
     */
    protected getParentDirectoryPath(): string;
    /**
     * ファイルシステムアイテムを新規作成する。
     */
    abstract create(): Promise<void>;
    /**
     * ファイルシステムアイテムを削除する。
     */
    abstract delete(): Promise<void>;
    /**
     * ファイルシステムアイテムを指定されたパスに移動する。
     *
     * @param destination
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
     * ファイルシステムアイテムの親ディレクトリを取得する。
     *
     * @returns
     */
    abstract getParentDirectory(): any;
    /**
     * ファイルシステムパスの区切り文字を取得する。
     *
     * @returns
     */
    static getFileSeparator(): string;
}
