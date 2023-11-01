import formidable from "formidable";
import { IncomingMessage } from "http";
import File from "../filesystem/File.js";

/**
 * フォームのクラス。
 */
export class FormParser {

    /**
     * コンストラクタ。IncomingMessageインスタンスを指定する。
     * 
     * @param incomingMessage 
     */
    public constructor(incomingMessage: IncomingMessage) {
        this.incomingMessage = incomingMessage;
        if (incomingMessage.closed) {
            throw new Error("Please change config.api.bodyParser to disabled. The stream has already closed.");
        }
    }

    private readonly incomingMessage: IncomingMessage;

    /**
     * フォームから送信されたリクエストを解析する。使用前にconfig.api.bodyParserをfalseに設定しておく必要がある。
     * 
     * @returns 
     */
    public parse(): Promise<FormParseResult> {
        return new Promise<FormParseResult>((resolve, reject) => {
            const form = formidable({});
            form.parse(this.incomingMessage).then((value: [formidable.Fields, formidable.Files]) => {
                resolve(new FormParseResult(value));
            }).catch((error) => {
                reject(error);
            });
        });
    }
}

/**
 * フォームを解析した結果のクラス。
 */
export class FormParseResult {

    /**
     * コンストラクタ。依存クラスの解析結果を指定する。
     * 
     * @param valueOfDependencyClass 
     */
    public constructor(valueOfDependencyClass : [formidable.Fields, formidable.Files]) {
        const formidableAllFields = valueOfDependencyClass[0];
        for (const key of Object.keys(formidableAllFields)) {
            const values = formidableAllFields[key];
            if (values) {
                this.values.set(key, values);
            }
        }
        const formidableAllFiles = valueOfDependencyClass[1];
        for (const key of Object.keys(formidableAllFiles)) {
            const files: File[] = [];
            const formidableFiles = formidableAllFiles[key];
            if (formidableFiles) {
                for (const formidableFile of formidableFiles) {
                    files.push(new File(formidableFile["filepath"]));
                }
            }
            this.files.set(key, files);
        }
    }

    private values = new Map<string, string[]>();

    /**
     * 値が送信されたすべてのHTMLInputElementの名前を取得する。
     * 
     * @returns 
     */
    public getValueNames(): string[] {
        return Array.from(this.values.keys());
    }

    /**
     * HTMLInputElementの名前を指定して値を取得する。
     * 
     * @param name 
     * @returns 
     */
    public getValue(name: string): string | undefined {
        const values = this.values.get(name);
        if (typeof values !== "undefined") {
            if (values.length > 0) {
                return values[0];
            }
        }
        return undefined;
    }

    /**
     * HTMLInputElementの名前を指定して複数値を取得する。
     * 
     * @param name 
     * @returns 
     */
    public getValues(name: string): string[] | undefined {
        const values = this.values.get(name);
        if (typeof values !== "undefined") {
            return values;
        }
        return undefined;
    }

    private files = new Map<string, File[]>();
    
    /**
     * ファイルが送信されたすべてのHTMLInputElementの名前を取得する。
     * 
     * @returns 
     */
    public getFileNames(): string[] {
        return Array.from(this.files.keys());
    }

    /**
     * HTMLInputElementの名前を指定してファイルを取得する。
     * 
     * @param name 
     * @returns 
     */
    public getFile(name: string): File | undefined {
        const files = this.files.get(name);
        if (typeof files !== "undefined") {
            if (files.length > 0) {
                return files[0];
            }
        }
        return undefined;
    }

    /**
     * HTMLInputElementの名前を指定して複数ファイルを取得する。
     * 
     * @param name 
     * @returns 
     */
    public getFiles(name: string): File[] | undefined {
        const files = this.files.get(name);
        if (typeof files !== "undefined") {
            return files;
        }
        return undefined;
    }
}
