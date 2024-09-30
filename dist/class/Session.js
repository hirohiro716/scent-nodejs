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
     * セッションデータを保存してセッションIDを取得する。
     *
     * @returns
     */
    async saveAndGetID() {
        const newID = StringObject.secureRandom(64).toString();
        if (typeof this._id !== "undefined") {
            try {
                await this.deleteFromStorage(this._id);
            }
            catch (error) {
            }
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
    async loadFromID(id) {
        await this.removeExpiredSessions();
        const json = await this.loadFromStorage(id);
        try {
            this._data = new Map(Object.entries(JSON.parse(json)));
            this._id = id;
        }
        catch (error) {
        }
    }
    /**
     * クロスサイトリクエストフォージェリ(CSRF)対策のトークンを発行する。
     *
     * @returns
     */
    issueToken() {
        const token = StringObject.secureRandom(64);
        this.data.set(this.getTokenProperty().physicalName, token.toString());
        return token.toString();
    }
    /**
     * 指定されたトークン文字列と前回発行したトークンが一致する場合はtrueを返す。
     *
     * @param token
     */
    isValidTokenString(token) {
        if (typeof this._data !== "undefined" && token.length > 0) {
            return StringObject.from(this._data.get(this.getTokenProperty().physicalName)).equals(token);
        }
        return false;
    }
}
