import { StringDecoder } from "string_decoder";
import { StringObject } from "scent-typescript";
/**
 * CSVのクラス。
 */
class CSV {
    constructor() {
        this._headers = null;
        this._delimiter = CSV.DEFAULT_DELIMITER;
        this._lineSeparator = "\r\n";
        this._rows = [];
    }
    /**
     * CSVファイルのヘッダー(項目名)。
     */
    get headers() {
        return this._headers;
    }
    set headers(headers) {
        this._headers = headers;
    }
    /**
     * CSVファイルの区切り文字。
     */
    get delimiter() {
        return this.delimiter;
    }
    set delimiter(delimiter) {
        this._delimiter = delimiter;
    }
    /**
     * CSVファイルの改行。
     */
    get lineSeparator() {
        return this._lineSeparator;
    }
    set lineSeparator(lineSeparator) {
        this.lineSeparator = lineSeparator;
    }
    /**
     * CSVファイルの行情報。
     */
    get rows() {
        return this._rows;
    }
    set rows(rows) {
        this._rows = rows;
    }
    /**
     * CSVファイル(utf-8)をStreamに書き込む。
     *
     * @param writable
     */
    write(writable) {
        let writing = [...this._rows];
        if (this._headers) {
            writing.unshift(this._headers);
        }
        return new Promise((resolve, reject) => {
            let index = 0;
            const write = () => {
                if (index >= writing.length) {
                    resolve();
                    return;
                }
                const row = writing[index];
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
            };
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
     */
    read(file, firstRowIsHeader) {
        const readable = file.createReadStream(undefined, "utf-8");
        const decoder = new StringDecoder("utf-8");
        return new Promise((resolve, reject) => {
            let row = [];
            let value = new StringObject();
            let withinString = false;
            let stringMaybeEnd = false;
            const parse = (one) => {
                switch (one) {
                    case this._delimiter:
                        if (withinString === false || stringMaybeEnd) {
                            row.push(value.toString());
                            value.set(null);
                            withinString = false;
                            stringMaybeEnd = false;
                        }
                        else {
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
                                }
                                else {
                                    this._rows.push(row);
                                }
                                row = [];
                            }
                            withinString = false;
                            stringMaybeEnd = false;
                        }
                        else {
                            value.append(one);
                        }
                        break;
                    case '"':
                        if (withinString === false) {
                            withinString = true;
                        }
                        else {
                            if (stringMaybeEnd) {
                                value.append(one);
                                stringMaybeEnd = false;
                            }
                            else {
                                stringMaybeEnd = true;
                            }
                        }
                        break;
                    default:
                        value.append(one);
                        break;
                }
            };
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
/**
 * CSVファイルの初期区切り文字。
 */
CSV.DEFAULT_DELIMITER = ",";
export default CSV;
