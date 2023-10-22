import FilesystemItem from "./FilesystemItem.js";
/**
 * ディレクトリのクラス。
 */
export default class Directory extends FilesystemItem {
    /**
     * コンストラクタ。ディレクトリのパスを指定する。
     *
     * @param path
     */
    constructor(path: string);
    /**
     * コンストラクタ。ディレクトリの名前、親ディレクトリを指定する。
     *
     * @param path
     */
    constructor(directoryName: string, parentDirectory: Directory);
    /**
     * ディレクトリを新規作成する。
     *
     * @returns
     */
    create(): Promise<void>;
    /**
     * ディレクトリを削除する。内包するアイテムも再帰的に削除される。
     *
     * @returns
     */
    delete(): Promise<void>;
    /**
     * ディレクトリを移動する。
     *
     * @param destination
     * @returns
     */
    move(destination: string): Promise<void>;
    /**
     * ディレクトリをコピーする。内包するアイテムも再帰的にコピーされる。
     *
     * @param destination
     * @returns
     */
    copy(destination: string): Promise<Directory>;
}
