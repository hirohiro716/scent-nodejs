import { Property } from "scent-typescript";
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
     * 指定されたIDに該当するセッション情報を記憶媒体から削除する。このメソッドはsaveメソッド実行時に自動的に呼び出され、古いセッション情報の削除に使用される。
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
    protected saveAndGetID(): Promise<string>;
    /**
     * セッションデータを保存してセッションIDを指定されたリソースに保存する。
     *
     * @param resource
     */
    abstract save(resource: any): Promise<void>;
    /**
     * 指定されたセッションIDに該当するJSONデータを記憶媒体から取得する。このメソッドはloadメソッド実行時に自動的に呼び出される。
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
    protected loadFromID(id: string): Promise<void>;
    /**
     * セッションデータを保存してセッションIDを指定されたリソースに保存する。
     *
     * @param resource
     */
    abstract load(resource: any): Promise<void>;
    /**
     * トークンに使用するプロパティを取得する。
     */
    abstract getTokenProperty(): Property;
    /**
     * クロスサイトリクエストフォージェリ(CSRF)対策のトークンを発行する。
     *
     * @returns
     */
    issueToken(): string;
    /**
     * 指定されたトークンと前回発行したトークンが一致する場合はtrueを返す。
     *
     * @param token
     */
    isValidToken(token: string): boolean;
}
