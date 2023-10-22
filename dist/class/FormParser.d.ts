/// <reference types="node" />
import formidable from "formidable";
import { IncomingMessage } from "http";
import File from "./filesystem/File.js";
/**
 * フォームのクラス。
 */
export declare class FormParser {
    /**
     * コンストラクタ。IncomingMessageオブジェクトを指定する。
     *
     * @param incomingMessage
     */
    constructor(incomingMessage: IncomingMessage);
    private readonly incomingMessage;
    /**
     * フォームから送信されたリクエストを解析する。使用前にconfig.api.bodyParserをfalseに設定しておく必要がある。
     *
     * @returns
     */
    parse(): Promise<FormParseResult>;
}
/**
 * フォームを解析した結果のクラス。
 */
export declare class FormParseResult {
    /**
     * コンストラクタ。依存クラスの解析結果を指定する。
     *
     * @param valueOfDependencyClass
     */
    constructor(valueOfDependencyClass: [formidable.Fields, formidable.Files]);
    private values;
    /**
     * 値が送信されたすべてのHTMLInputElementの名前を取得する。
     *
     * @returns
     */
    getValueNames(): string[];
    /**
     * HTMLInputElementの名前を指定して値を取得する。
     *
     * @param name
     * @returns
     */
    getValue(name: string): string | undefined;
    /**
     * HTMLInputElementの名前を指定して複数値を取得する。
     *
     * @param name
     * @returns
     */
    getValues(name: string): string[] | undefined;
    private files;
    /**
     * ファイルが送信されたすべてのHTMLInputElementの名前を取得する。
     *
     * @returns
     */
    getFileNames(): string[];
    /**
     * HTMLInputElementの名前を指定してファイルを取得する。
     *
     * @param name
     * @returns
     */
    getFile(name: string): File | undefined;
    /**
     * HTMLInputElementの名前を指定して複数ファイルを取得する。
     *
     * @param name
     * @returns
     */
    getFiles(name: string): File[] | undefined;
}
