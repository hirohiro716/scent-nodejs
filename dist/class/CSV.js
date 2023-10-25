import { StringDecoder } from "string_decoder";
import { StringObject } from "scent-typescript";
/**
 * CSVのクラス。
 */
class CSV {
    constructor() {
        /**
         * CSVファイルのヘッダー(項目名)。
         */
        this.headers = null;
        /**
         * CSVファイルの区切り文字。
         */
        this.delimiter = CSV.DEFAULT_DELIMITER;
        /**
         * CSVファイルの改行。
         */
        this.lineSeparator = "\r\n";
        /**
         * CSVファイルの行情報。
         */
        this.rows = [];
    }
    /**
     * CSVファイル(utf-8)をStreamに書き込む。
     *
     * @param writable
     * @returns
     */
    write(writable) {
        let writing = [...this.rows];
        if (this.headers) {
            writing.unshift(this.headers);
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
     * @returns
     */
    read(file, firstRowIsHeader) {
        const readable = file.createReadStream("utf-8");
        const decoder = new StringDecoder("utf-8");
        return new Promise((resolve, reject) => {
            let row = [];
            let value = new StringObject();
            let withinString = false;
            let stringMaybeEnd = false;
            const parse = (one) => {
                switch (one) {
                    case this.delimiter:
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
                                if (firstRowIsHeader && this.headers === null) {
                                    this.headers = row;
                                }
                                else {
                                    this.rows.push(row);
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
            readable.on("data", (chunk) => {
                const decodedString = decoder.write(chunk);
                for (let index = 0; index < decodedString.length; index++) {
                    const one = decodedString.charAt(index);
                    parse(one);
                }
            });
            readable.on("end", () => {
                resolve();
            });
            readable.on("error", (error) => {
                reject(error);
            });
        });
    }
}
/**
 * CSVファイルの初期区切り文字。
 */
CSV.DEFAULT_DELIMITER = ",";
export default CSV;
