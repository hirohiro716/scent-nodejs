import { Writable } from "stream";
import File from "../filesystem/File.js";
import { StringDecoder } from "string_decoder";
import { StringObject } from "scent-typescript";

/**
 * CSVのクラス。
 */
export default class CSV {

    /**
     * CSVファイルのヘッダー(項目名)。
     */
    public headers: string[] | null = null;

    /**
     * CSVファイルの初期区切り文字。
     */
    public static readonly DEFAULT_DELIMITER: string = ",";

    /**
     * CSVファイルの区切り文字。
     */
    public delimiter: string = CSV.DEFAULT_DELIMITER;

    /**
     * CSVファイルの改行。
     */
    public lineSeparator: string = "\r\n";

    /**
     * CSVファイルの行情報。
     */
    public rows: string[][] = [];

    /**
     * CSVファイル(utf-8)をStreamに書き込む。
     * 
     * @param writable 
     * @returns 
     */
    public write(writable: Writable): Promise<void> {
        let writing: string[][] = [...this.rows];
        if (this.headers) {
            writing.unshift(this.headers);
        }
        return new Promise<void>((resolve, reject) => {
            let index = 0;
            const write: () => void = () => {
                if (index >= writing.length) {
                    resolve();
                    return;
                }
                const row: string[] = writing[index];
                const line = new StringObject();
                for (const value of row) {
                    if (line.length() > 0) {
                        line.append(this.delimiter);
                    }
                    line.append('"');
                    line.append(StringObject.from(value).replace('"', '""'));
                    line.append('"');
                }
                line.append(this.lineSeparator);
                const result = writable.write(line.toString(), "utf-8", (error) => {
                    if (error) {
                        reject(error);
                    }
                });
                index++;
                if (result) {
                    write();
                }
            }
            writable.on("error", (error) => {
                reject(error);
            });
            writable.on("drain", () => {
                write();
            });
            write();
        });
    }

    /**
     * CSVファイル(utf-8)を読み込む。
     * 
     * @param file 
     * @param firstRowIsHeader 最初の行をヘッダー(項目名)として扱う場合はtrueを指定。
     * @returns 
     */
    public read(file: File, firstRowIsHeader: boolean): Promise<void> {
        const readable = file.createReadStream(undefined, "utf-8");
        const decoder = new StringDecoder("utf-8");
        return new Promise<void>((resolve, reject) => {
            let row: string[] = [];
            let value = new StringObject();
            let withinString = false;
            let stringMaybeEnd = false;
            const parse: (one: string) => void = (one): void => {
                switch (one) {
                    case this.delimiter:
                        if (withinString === false || stringMaybeEnd) {
                            row.push(value.toString());
                            value.set(null);
                            withinString = false;
                            stringMaybeEnd = false;
                        } else {
                            value.append(one);
                        }
                        break;
                    case "\n":
                    case "\r":
                        if (withinString === false || stringMaybeEnd) {
                            if (value.length() > 0 || row.length > 0) {
                                row.push(value.toString());
                                value.set(null);
                                if (firstRowIsHeader && this.headers === null) {
                                    this.headers = row;
                                } else {
                                    this.rows.push(row);
                                }
                                row = [];
                            }
                            withinString = false;
                            stringMaybeEnd = false;
                        } else {
                            value.append(one);
                        }
                        break;
                    case '"':
                        if (withinString === false) {
                            withinString = true;
                        } else {
                            if (stringMaybeEnd) {
                                value.append(one);
                                stringMaybeEnd = false;
                            } else {
                                stringMaybeEnd = true;
                            }
                        }
                        break;
                    default:
                        value.append(one);
                        break;
                }
            }
            readable.on("end", () => {
                resolve();
            });
            readable.on("error", (error) => {
                reject(error);
            });
            readable.on("data", (chunk) => {
                const decodedString = decoder.write(chunk);
                for (let index = 0; index < decodedString.length; index++) {
                    const one = decodedString.charAt(index);
                    parse(one);
                }
            });
        });
    }
}
