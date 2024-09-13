import { StringObject } from "scent-typescript";
/**
 * セッションの抽象クラス。
 */
export default class Session {
    /**
     * このセッションのID。
     */
    get id() {
        return this._id;
    }
    /**
     * このセッションのデータ。
     */
    get data() {
        if (typeof this._data === "undefined") {
            this._data = new Map();
        }
        return this._data;
    }
    /**
     * セッションデータを保存してセッションIDを返す。
     *
     * @returns
     */
    async save() {
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
     * 指定されたIDに該当するセッションデータを読み込む。
     *
     * @param id
     */
    async load(id) {
        await this.removeExpiredSessions();
        const json = await this.loadFromStorage(id);
        try {
            this._data = new Map(Object.entries(JSON.parse(json)));
            this._id = id;
        }
        catch (error) {
        }
    }
}
