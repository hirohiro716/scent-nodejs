import { StringObject } from "scent-typescript";
import FilesystemItem from "./FilesystemItem.js";
import fs from "fs";

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
}
