import formidable from "formidable";
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
    constructor(incomingMessage) {
        this.incomingMessage = incomingMessage;
        if (incomingMessage.closed) {
            throw new Error("Please change config.api.bodyParser to disabled. The stream has already closed.");
        }
    }
    /**
     * フォームから送信されたリクエストを解析する。
     * Next.jsで使用する場合は、使用前にconfig.api.bodyParserをfalseに設定しておく必要がある。
     *
     * @returns
     */
    async parse() {
        const formidableInstance = formidable({});
        const values = await formidableInstance.parse(this.incomingMessage);
        return new FormParseResult(values);
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
    constructor(valueOfDependencyClass) {
        this.values = new Map();
        this.files = new Map();
        const formidableAllFields = valueOfDependencyClass[0];
        for (const key of Object.keys(formidableAllFields)) {
            const values = formidableAllFields[key];
            if (values) {
                this.values.set(key, values);
            }
        }
        const formidableAllFiles = valueOfDependencyClass[1];
        for (const key of Object.keys(formidableAllFiles)) {
            const files = [];
            const formidableFiles = formidableAllFiles[key];
            if (formidableFiles) {
                for (const formidableFile of formidableFiles) {
                    files.push(new File(formidableFile["filepath"]));
                }
            }
            this.files.set(key, files);
        }
    }
    /**
     * 値が送信されたすべてのHTMLInputElementの名前を取得する。
     *
     * @returns
     */
    getValueNames() {
        return Array.from(this.values.keys());
    }
    /**
     * HTMLInputElementの名前を指定して値を取得する。
     *
     * @param name
     * @returns
     */
    getValue(name) {
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
    getValues(name) {
        const values = this.values.get(name);
        if (typeof values !== "undefined") {
            return values;
        }
        return undefined;
    }
    /**
     * ファイルが送信されたすべてのHTMLInputElementの名前を取得する。
     *
     * @returns
     */
    getFileNames() {
        return Array.from(this.files.keys());
    }
    /**
     * HTMLInputElementの名前を指定してファイルを取得する。
     *
     * @param name
     * @returns
     */
    getFile(name) {
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
    getFiles(name) {
        const files = this.files.get(name);
        if (typeof files !== "undefined") {
            return files;
        }
        return undefined;
    }
}
