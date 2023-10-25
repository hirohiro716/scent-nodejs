import { StringObject } from "scent-typescript";
import FilesystemItem from "./FilesystemItem.js";
import fs from "fs";
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
}
