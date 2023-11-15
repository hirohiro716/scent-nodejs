import { Regex, StringObject } from "scent-typescript";
import FilesystemItem from "./FilesystemItem.js";
import fs from "fs";
import path from "path";
import File from "./File.js";

/**
 * ディレクトリのクラス。
 */
export default class Directory extends FilesystemItem {

    /**
     * コンストラクタ。ディレクトリのパスを指定する。
     * 
     * @param path 
     */
    public constructor(path: string);

    /**
     * コンストラクタ。ディレクトリの名前、親ディレクトリを指定する。
     * 
     * @param path 
     */
    public constructor(directoryName: string, parentDirectory: Directory);

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
     * ディレクトリを新規作成する。
     */
    public async create(): Promise<void> {
        await fs.promises.mkdir(this.path, { recursive: true });
    }

    /**
     * ディレクトリを削除する。内包するアイテムも再帰的に削除される。
     */
    public async delete(): Promise<void> {
        await fs.promises.rm(this.path, { recursive: true, force: true });
    }

    /**
     * ディレクトリを移動する。
     * 
     * @param destination 
     */
    public async move(destination: string): Promise<void> {
        await fs.promises.rename(this.path, destination);
        this.path = destination;
    }

    /**
     * ディレクトリをコピーする。内包するアイテムも再帰的にコピーされる。
     * 
     * @param destination 
     * @returns 
     */
    public async copy(destination: string): Promise<Directory> {
        await fs.promises.cp(this.path, destination, { force: true, recursive: true });
        return new Directory(destination);
    }

    /**
     * ディレクトリの親ディレクトリを取得する。
     * 
     * @returns 
     */
    public getParentDirectory(): Directory {
        return new Directory(super.getParentDirectoryPath());
    }

    /**
     * ディレクトリ直下のすべてのファイルシステムアイテムのパスを取得する。
     * 
     * @returns 
     */
    private async getItemPaths(): Promise<string[]> {
        const filesystemItemNames = await fs.promises.readdir(this.getAbsolutePath());
        const filesystemItemPaths: string[] = [];
        for (const filesystemItemName of filesystemItemNames) {
            const filesystemItemPath = path.join(this.getAbsolutePath(), filesystemItemName);
            filesystemItemPaths.push(filesystemItemPath);
        }
        return filesystemItemPaths;
    }

    /**
     * ディレクトリ直下のすべてのファイルシステムアイテムを取得する。
     * 
     * @param regexToFilterDirectoryName ディレクトリ名をフィルタするための正規表現。
     * @param regexToFilterFileName ファイル名をフィルタするための正規表現。
     * @returns 
     */
    public async getItems(regexToFilterDirectoryName?: string, regexToFilterFileName?: string): Promise<FilesystemItem[]> {
        const filesystemItems: FilesystemItem[] = [];
        const filesystemItemPaths = await this.getItemPaths();
        for (const filesystemItemPath of filesystemItemPaths) {
            if (await FilesystemItem.hasDirectory(filesystemItemPath)) {
                const itemDirectory = new Directory(filesystemItemPath);
                if (typeof regexToFilterDirectoryName === "undefined" || new Regex(regexToFilterDirectoryName).test(itemDirectory.getName())) {
                    filesystemItems.push(itemDirectory);
                }
            } else {
                const itemFile = new File(filesystemItemPath);
                if (typeof regexToFilterFileName === "undefined" || Regex.from(regexToFilterFileName).test(itemFile.getName())) {
                    filesystemItems.push(itemFile);
                }
            }
        }
        return filesystemItems;
    }

    /**
     * 指定されたディレクトリ内にある、すべてのファイルシステムアイテムをサブディレクトリを含めて検索する。
     * 
     * @param directory 
     * @param regexToFilterDirectoryName ディレクトリ名をフィルタするための正規表現。
     * @param regexToFilterFileName ファイル名をフィルタするための正規表現。
     * @returns 
     */
    private static async searchItemsFrom(directory: Directory, regexToFilterDirectoryName?: string, regexToFilterFileName?: string): Promise<FilesystemItem[]> {
        const filesystemItems: FilesystemItem[] = [];
        const filesystemItemPaths = await directory.getItemPaths();
        for (const filesystemItemPath of filesystemItemPaths) {
            if (await FilesystemItem.hasDirectory(filesystemItemPath)) {
                const itemDirectory = new Directory(filesystemItemPath);
                if (typeof regexToFilterDirectoryName === "undefined" || new Regex(regexToFilterDirectoryName).test(itemDirectory.getName())) {
                    filesystemItems.push(itemDirectory);
                    filesystemItems.push(...await Directory.searchItemsFrom(itemDirectory, regexToFilterDirectoryName, regexToFilterFileName));
                }
            } else {
                const itemFile = new File(filesystemItemPath);
                if (typeof regexToFilterFileName === "undefined" || Regex.from(regexToFilterFileName).test(itemFile.getName())) {
                    filesystemItems.push(itemFile);
                }
            }
        }
        return filesystemItems;
    }

    /**
     * ディレクトリ内にある、すべてのファイルシステムアイテムをサブディレクトリを含めて検索する。
     * 
     * @param regexToFilterDirectoryName ディレクトリ名をフィルタするための正規表現。
     * @param regexToFilterFileName ファイル名をフィルタするための正規表現。
     * @returns 
     */
    public searchItems(regexToFilterDirectoryName?: string, regexToFilterFileName?: string): Promise<FilesystemItem[]> {
        return Directory.searchItemsFrom(this, regexToFilterDirectoryName, regexToFilterFileName);
    }
}
