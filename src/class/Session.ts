import { StringObject } from "scent-typescript";

/**
 * セッションの抽象クラス。
 */
export default abstract class Session {

    private _id: string | undefined;

    /**
     * このセッションのID。
     */
    public get id(): string | undefined {
        return this._id;
    }

    private _data: Map<string, any> | undefined;

    /**
     * このセッションのデータ。
     */
    public get data(): Map<string, any> {
        if (typeof this._data === "undefined") {
            this._data = new Map();
        }
        return this._data;
    }

    /**
     * 指定されたIDに該当するセッション情報を記憶媒体から削除する。このメソッドはsaveメソッド実行時に自動的に呼び出され、古いセッション情報の削除に使用される。
     * 
     * @param id 
     */
    protected abstract deleteFromStorage(id: string): Promise<void>;

    /**
     * 指定されたセッションID、JSONデータを記憶媒体に保存する。
     * 
     * @param id 
     * @param jsonData 
     */
    protected abstract saveToStorage(id: string, jsonData: string): Promise<void>;

    /**
     * セッションデータを保存してセッションIDを返す。
     * 
     * @returns
     */
    public async save(): Promise<string> {
        const newID = StringObject.secureRandom(64).toString();
        if (typeof this._id !== "undefined") {
            await this.deleteFromStorage(this._id);
        }
        if (typeof this._data !== "undefined") {
            await this.saveToStorage(newID, JSON.stringify(Object.fromEntries(this._data)));
        }
        return newID;
    }

    /**
     * 指定されたセッションIDに該当するJSONデータを記憶媒体から取得する。
     * 
     * @param id 
     * @returns
     */
    protected abstract loadFromStorage(id: string): Promise<string>;

    /**
     * 期限が切れたセッション情報を記憶媒体から削除する。このメソッドはloadメソッド実行時に自動的に呼び出される。
     */
    protected abstract removeExpiredSessions(): Promise<void>;

    /**
     * 指定されたIDに該当するセッションデータを読み込む。
     * 
     * @param id 
     */
    public async load(id: string): Promise<void> {
        await this.removeExpiredSessions();
        const json = await this.loadFromStorage(id);
        try {
            this._data = new Map(Object.entries(JSON.parse(json)));
            this._id = id;
        } catch (error :any) {
        }
    }
}
