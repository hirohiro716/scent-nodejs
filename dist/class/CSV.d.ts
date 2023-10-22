/// <reference types="node" />
import { Writable } from "stream";
import File from "./filesystem/File.js";
/**
 * CSVのクラス。
 */
export default class CSV {
    /**
     * CSVファイルのヘッダー(項目名)。
     */
    headers: string[] | null;
    /**
     * CSVファイルの初期区切り文字。
     */
    static readonly DEFAULT_DELIMITER: string;
    /**
     * CSVファイルの区切り文字。
     */
    delimiter: string;
    /**
     * CSVファイルの改行。
     */
    lineSeparator: string;
    /**
     * CSVファイルの行情報。
     */
    rows: string[][];
    /**
     * CSVファイル(utf-8)をStreamに書き込む。
     *
     * @param writable
     * @returns
     */
    write(writable: Writable): Promise<void>;
    /**
     * CSVファイル(utf-8)を読み込む。
     *
     * @param file
     * @param firstRowIsHeader 最初の行をヘッダー(項目名)として扱う場合はtrueを指定。
     * @returns
     */
    read(file: File, firstRowIsHeader: boolean): Promise<void>;
}
