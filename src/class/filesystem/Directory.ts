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
     * 
     * @returns 
     */
    public create(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.mkdir(this.path, { recursive: true }, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * ディレクトリを削除する。内包するアイテムも再帰的に削除される。
     * 
     * @returns 
     */
    public delete(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.rm(this.path, { recursive: true, force: true }, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * ディレクトリを移動する。
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
     * ディレクトリをコピーする。内包するアイテムも再帰的にコピーされる。
     * 
     * @param destination 
     * @returns 
     */
    public copy(destination: string): Promise<Directory> {
        return new Promise<Directory>((resolve, reject) => {
            fs.cp(this.path, destination, { force: true, recursive: true }, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(new Directory(destination));
            });
        });
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
    private getItemPaths(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            fs.readdir(this.getAbsolutePath(), (error: any, filesystemItemNames: string[]) => {
                if (error) {
                    reject(error);
                } else {
                    const filesystemItemPaths: string[] = [];
                    for (const filesystemItemName of filesystemItemNames) {
                        const filesystemItemPath = path.join(this.getAbsolutePath(), filesystemItemName);
                        filesystemItemPaths.push(filesystemItemPath);
                    }
                    resolve(filesystemItemPaths);
                }
            });
        });
    }

    /**
     * ディレクトリ直下のすべてのファイルシステムアイテムを取得する。
     * 
     * @param regexToFilterDirectoryName ディレクトリ名をフィルタするための正規表現。
     * @param regexToFilterFileName ファイル名をフィルタするための正規表現。
     * @returns 
     */
    public getItems(regexToFilterDirectoryName?: string, regexToFilterFileName?: string): Promise<FilesystemItem[]> {
        return new Promise<FilesystemItem[]>(async (resolve, reject) => {
            try {
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
                resolve(filesystemItems);
            } catch (error: any) {
                reject(error);
            }
        });
    }

    /**
     * 指定されたディレクトリ内にある、すべてのファイルシステムアイテムをサブディレクトリを含めて検索する。
     * 
     * @param directory 
     * @param regexToFilterDirectoryName ディレクトリ名をフィルタするための正規表現。
     * @param regexToFilterFileName ファイル名をフィルタするための正規表現。
     * @returns 
     */
    private static searchItemsFrom(directory: Directory, regexToFilterDirectoryName?: string, regexToFilterFileName?: string): Promise<FilesystemItem[]> {
        return new Promise<FilesystemItem[]>(async (resolve, reject) => {
            try {
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
                resolve(filesystemItems);
            } catch (error: any) {
                reject(error);
            }
        });
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
