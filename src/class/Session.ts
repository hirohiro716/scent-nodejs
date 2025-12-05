import { Property, RecordMap, StringObject } from "scent-typescript";
import RecordBinder from "./database/RecordBinder";
import SingleRecordBinder from "./database/SingleRecordBinder";

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
     * 指定されたIDに該当するセッション情報を記憶媒体から削除する。
     * このメソッドはsaveメソッド実行時に自動的に呼び出され、古いセッション情報の削除に使用される。
     * 
     * @param id 
     */
    protected abstract deleteFromStorage(id: string): Promise<void>;

    /**
     * 指定されたセッションID、JSONデータを記憶媒体に保存する。このメソッドはsaveメソッド実行時に自動的に呼び出される。
     * 
     * @param id 
     * @param jsonData 
     */
    protected abstract saveToStorage(id: string, jsonData: string): Promise<void>;

    /**
     * セッションデータを保存してセッションIDを取得する。
     * 
     * @returns
     */
    protected async saveAndGetID(): Promise<string> {
        const newID = StringObject.secureRandom(64).toString();
        if (typeof this._id !== "undefined") {
            try {
                await this.deleteFromStorage(this._id);
            } catch (error: any) {
            }
        }
        if (typeof this._data !== "undefined") {
            await this.saveToStorage(newID, JSON.stringify(Object.fromEntries(this._data)));
        }
        return newID;
    }

    /**
     * セッションデータを保存してセッションIDを指定されたリソースに保存する。
     * 
     * @param resource 
     */
    public abstract save(resource: any): Promise<void>;

    /**
     * 指定されたセッションIDに該当するJSONデータを記憶媒体から取得する。
     * このメソッドはloadメソッド実行時に自動的に呼び出される。
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
    protected async loadFromID(id: string): Promise<void> {
        await this.removeExpiredSessions();
        const json = await this.loadFromStorage(id);
        try {
            this._data = new Map(Object.entries(JSON.parse(json)));
            this._id = id;
        } catch (error :any) {
        }
    }

    /**
     * セッションデータを保存してセッションIDを指定されたリソースに保存する。
     * 
     * @param resource 
     */
    public abstract load(resource: any): Promise<void>;

    /**
     * トークンを格納するために使用するプロパティを取得する。
     */
    public abstract getPropertyOfToken(): Property;

    /**
     * クロスサイトリクエストフォージェリ(CSRF)対策のトークンを発行する。
     * 
     * @returns 
     */
    public issueToken(): string {
        const token = StringObject.secureRandom(64);
        this.data.set(this.getPropertyOfToken().physicalName, token.toString());
        return token.toString();
    }

    /**
     * 指定されたトークン文字列と前回発行したトークンが一致する場合はtrueを返す。
     * 
     * @param token 
     */
    protected async isValidTokenString(token: string): Promise<boolean> {
        let result = false;
        if (typeof this._id !== "undefined" && typeof this._data !== "undefined" && token.length > 0) {
            result = StringObject.from(this._data.get(this.getPropertyOfToken().physicalName)).equals(token);
            this._data.delete(this.getPropertyOfToken().physicalName);
            await this.deleteFromStorage(this._id);
            await this.saveToStorage(this._id, JSON.stringify(Object.fromEntries(this._data)));
        }
        return result;
    }

    /**
     * 指定されたリソースが含むトークンとセッションが前回発行したトークンが一致する場合はtrueを返す。
     * 
     * @param resource
     * @returns
     */
    public abstract isValidToken(resource: any): Promise<boolean>;

    /**
     * 編集開始時のデータベースレコードのクローンを格納するために使用するプロパティを取得する。
     */
    public abstract getPropertyOfPreEditRecords(): Property;

    /**
     * 指定されたRecordBinderインスタンスの編集開始時のレコードをセッションに格納する。
     * 格納されたレコードはRecordBinderインスタンスで更新する際のコンフリクト確認に使用される。
     * 
     * @param recordBinder 
     */
    public setPreEditRecords(recordBinder: RecordBinder<any>): void {
        const preEditRecords: Record<string, Record<string, Array<Record<string, any>> | null>> = {...this.data.get(this.getPropertyOfPreEditRecords().physicalName)};
        const table = recordBinder.getTable();
        if (Object.keys(preEditRecords).includes(table.physicalName) === false) {
            preEditRecords[table.physicalName] = {};
        }
        const whereSetStringObject = new StringObject();
        if (recordBinder.whereSet !== null) {
            recordBinder.whereSet.sort();
            whereSetStringObject.append(JSON.stringify(recordBinder.whereSet.toObject()));
        }
        preEditRecords[table.physicalName][whereSetStringObject.toString()] = null;
        if (recordBinder.preEditRecords !== null) {
            preEditRecords[table.physicalName][whereSetStringObject.toString()] = RecordMap.toObjects(recordBinder.preEditRecords);
        }
        this.data.set(this.getPropertyOfPreEditRecords().physicalName, preEditRecords);
    }

    /**
     * 指定されたRecordBinderインスタンスにセッションに格納されている編集開始時のレコードを適用する。
     * 復元されたレコードはRecordBinderインスタンスで更新する際のコンフリクト確認に使用される。
     * 
     * @param recordBinder 
     */
    public applyPreEditRecords(recordBinder: RecordBinder<any>): void {
        recordBinder.preEditRecords = [];
        const preEditRecords: Record<string, Record<string, Array<Record<string, any>> | null>> = {...this.data.get(this.getPropertyOfPreEditRecords().physicalName)};
        const table = recordBinder.getTable();
        if (Object.keys(preEditRecords).includes(table.physicalName) === false) {
            preEditRecords[table.physicalName] = {};
        }
        const whereSetStringObject = new StringObject();
        if (recordBinder.whereSet !== null) {
            recordBinder.whereSet.sort();
            whereSetStringObject.append(JSON.stringify(recordBinder.whereSet.toObject()));
        }
        if (Object.keys(preEditRecords[table.physicalName]).includes(whereSetStringObject.toString()) === false) {
            preEditRecords[table.physicalName][whereSetStringObject.toString()] = [];
        }
        const preEditRecordObjects = preEditRecords[recordBinder.getTable().physicalName][whereSetStringObject.toString()];
        if (preEditRecordObjects !== null) {
            recordBinder.preEditRecords = [];
            for (const preEditRecordObject of preEditRecordObjects) {
                const record = table.createRecord(preEditRecordObject);
                recordBinder.preEditRecords.push(record);
                if (recordBinder.records.length === 0 && recordBinder instanceof SingleRecordBinder) {
                    recordBinder.record = record.clone();
                    break;
                }
            }
        }
    }
}
