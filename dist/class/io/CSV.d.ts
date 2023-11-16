/// <reference types="node" />
import { Writable } from "stream";
import File from "../filesystem/File.js";
/**
 * CSVのクラス。
 */
export default class CSV {
    private _headers;
    /**
     * CSVファイルのヘッダー(項目名)。
     */
    get headers(): string[] | null;
    set headers(headers: string[] | null);
    /**
     * CSVファイルの初期区切り文字。
     */
    static readonly DEFAULT_DELIMITER: string;
    private _delimiter;
    /**
     * CSVファイルの区切り文字。
     */
    get delimiter(): string;
    set delimiter(delimiter: string);
    private _lineSeparator;
    /**
     * CSVファイルの改行。
     */
    get lineSeparator(): string;
    set lineSeparator(lineSeparator: string);
    private _rows;
    /**
     * CSVファイルの行情報。
     */
    get rows(): string[][];
    set rows(rows: string[][]);
    /**
     * CSVファイル(utf-8)をStreamに書き込む。
     *
     * @param writable
     */
    write(writable: Writable): Promise<void>;
    /**
     * CSVファイル(utf-8)を読み込む。
     *
     * @param file
     * @param firstRowIsHeader 最初の行をヘッダー(項目名)として扱う場合はtrueを指定。
     */
    read(file: File, firstRowIsHeader: boolean): Promise<void>;
}
