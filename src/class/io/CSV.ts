import { Writable } from "stream";
import File from "../filesystem/File.js";
import { StringDecoder } from "string_decoder";
import { StringObject } from "scent-typescript";

/**
 * CSVのクラス。
 */
export default class CSV {

    private _headers: string[] | null = null;

    /**
     * CSVファイルのヘッダー(項目名)。
     */
    public get headers(): string[] | null {
        return this._headers;
    }

    public set headers(headers: string[] | null) {
        this._headers = headers;
    }

    /**
     * CSVファイルの初期区切り文字。
     */
    public static readonly DEFAULT_DELIMITER: string = ",";

    private _delimiter: string = CSV.DEFAULT_DELIMITER;

    /**
     * CSVファイルの区切り文字。
     */
    public get delimiter(): string {
        return this.delimiter;
    }

    public set delimiter(delimiter: string) {
        this._delimiter = delimiter;
    }

    private _lineSeparator: string = "\r\n";

    /**
     * CSVファイルの改行。
     */
    public get lineSeparator(): string {
        return this._lineSeparator;
    }

    public set lineSeparator(lineSeparator: string) {
        this.lineSeparator = lineSeparator;
    }

    private _rows: string[][] = [];

    /**
     * CSVファイルの行情報。
     */
    public get rows(): string[][] {
        return this._rows;
    }

    public set rows(rows: string[][]) {
        this._rows = rows;
    }

    /**
     * CSVファイル(utf-8)をStreamに書き込む。
     * 
     * @param writable 
     * @returns 
     */
    public write(writable: Writable): Promise<void> {
        let writing: string[][] = [...this._rows];
        if (this._headers) {
            writing.unshift(this._headers);
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
                        line.append(this._delimiter);
                    }
                    line.append('"');
                    line.append(StringObject.from(value).replace('"', '""'));
                    line.append('"');
                }
                line.append(this._lineSeparator);
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
                    case this._delimiter:
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
                                if (firstRowIsHeader && this._headers === null) {
                                    this._headers = row;
                                } else {
                                    this._rows.push(row);
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
