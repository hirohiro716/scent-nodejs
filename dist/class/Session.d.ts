/**
 * セッションの抽象クラス。
 */
export default abstract class Session {
    private _id;
    /**
     * このセッションのID。
     */
    get id(): string | undefined;
    private _data;
    /**
     * このセッションのデータ。
     */
    get data(): Map<string, any>;
    /**
     * 指定されたIDに該当するセッション情報を記憶媒体から削除する。
     *
     * @param id
     */
    protected abstract deleteFromStorage(id: string): Promise<void>;
    /**
     * 期限が切れたセッション情報を記憶媒体から削除する。このメソッドはloadメソッド実行時に自動的に呼び出される。
     */
    protected abstract removeExpiredSessions(): Promise<void>;
    /**
     * 指定されたセッションIDに該当するJSONデータを記憶媒体から取得する。
     *
     * @param id
     * @returns
     */
    protected abstract loadFromStorage(id: string): Promise<string>;
    /**
     * 指定されたIDに該当するセッションデータを読み込む。
     *
     * @param id
     */
    load(id: string): Promise<void>;
    /**
     * 指定されたセッションID、JSONデータを記憶媒体に保存する。
     *
     * @param id
     * @param jsonData
     * @param oldID 古いセッションID。
     */
    protected abstract saveToStorage(id: string, jsonData: string, oldID: string | undefined): Promise<void>;
    /**
     * セッションデータを保存してセッションIDを返す。
     *
     * @returns
     */
    save(): Promise<string>;
}
