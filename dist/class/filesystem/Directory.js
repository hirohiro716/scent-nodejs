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
     * @deprecated
     */
    constructor(parameter1, parameter2) {
        if (typeof parameter2 !== "undefined") {
            const path = new StringObject(parameter2.path);
            if (path.toString().endsWith(FilesystemItem.getFileSeparator()) === false) {
                path.append(FilesystemItem.getFileSeparator());
            }
            path.append(parameter1);
            super(path.toString());
        }
        else {
            super(String(parameter1));
        }
    }
    /**
     * ディレクトリを新規作成する。
     *
     * @returns
     */
    create() {
        return new Promise((resolve, reject) => {
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
    delete() {
        return new Promise((resolve, reject) => {
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
    move(destination) {
        return new Promise((resolve, reject) => {
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
    copy(destination) {
        return new Promise((resolve, reject) => {
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
    getParentDirectory() {
        return new Directory(super.getParentDirectoryPath());
    }
    /**
     * ディレクトリ直下のすべてのファイルシステムアイテムのパスを取得する。
     *
     * @returns
     */
    getItemPaths() {
        return new Promise(async (resolve, reject) => {
            fs.readdir(this.getAbsolutePath(), (error, filesystemItemNames) => {
                if (error) {
                    reject(error);
                }
                else {
                    const filesystemItemPaths = [];
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
    getItems(regexToFilterDirectoryName, regexToFilterFileName) {
        return new Promise(async (resolve, reject) => {
            try {
                const filesystemItems = [];
                const filesystemItemPaths = await this.getItemPaths();
                for (const filesystemItemPath of filesystemItemPaths) {
                    if (await FilesystemItem.hasDirectory(filesystemItemPath)) {
                        const itemDirectory = new Directory(filesystemItemPath);
                        if (typeof regexToFilterDirectoryName === "undefined" || new Regex(regexToFilterDirectoryName).test(itemDirectory.getName())) {
                            filesystemItems.push(itemDirectory);
                        }
                    }
                    else {
                        const itemFile = new File(filesystemItemPath);
                        if (typeof regexToFilterFileName === "undefined" || Regex.from(regexToFilterFileName).test(itemFile.getName())) {
                            filesystemItems.push(itemFile);
                        }
                    }
                }
                resolve(filesystemItems);
            }
            catch (error) {
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
    static searchItemsFrom(directory, regexToFilterDirectoryName, regexToFilterFileName) {
        return new Promise(async (resolve, reject) => {
            try {
                const filesystemItems = [];
                const filesystemItemPaths = await directory.getItemPaths();
                for (const filesystemItemPath of filesystemItemPaths) {
                    if (await FilesystemItem.hasDirectory(filesystemItemPath)) {
                        const itemDirectory = new Directory(filesystemItemPath);
                        if (typeof regexToFilterDirectoryName === "undefined" || new Regex(regexToFilterDirectoryName).test(itemDirectory.getName())) {
                            filesystemItems.push(itemDirectory);
                            filesystemItems.push(...await Directory.searchItemsFrom(itemDirectory, regexToFilterDirectoryName, regexToFilterFileName));
                        }
                    }
                    else {
                        const itemFile = new File(filesystemItemPath);
                        if (typeof regexToFilterFileName === "undefined" || Regex.from(regexToFilterFileName).test(itemFile.getName())) {
                            filesystemItems.push(itemFile);
                        }
                    }
                }
                resolve(filesystemItems);
            }
            catch (error) {
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
    searchItems(regexToFilterDirectoryName, regexToFilterFileName) {
        return Directory.searchItemsFrom(this, regexToFilterDirectoryName, regexToFilterFileName);
    }
}
