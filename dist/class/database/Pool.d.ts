import DatabaseError from "./DatabaseError.js";
/**
 * データベース接続をプールするためのクラス。
 *
 * @template D デリゲートの型。
 * @template C データベースに接続するためのパラメーターの型。
 * @template CD コネクターのデリゲートの型。
 */
export default abstract class Pool<D, C, CD> {
    /**
     * コンストラクタ。
     *
     * @param delegate デリゲートインスタンス。
     * @param connectionParameters データベース接続に使用するパラメーター。
     */
    protected constructor(delegate: D, connectionParameters: C);
    /**
     * 各データベース固有のプールインスタンス。
     */
    readonly delegate: D;
    /**
     * データベース接続に使用するパラメーター。
     */
    readonly connectionParameters: C;
    /**
     * データベースに接続するためのコネクターのデリゲートインスタンスを取得する。
     *
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract borrowConnectorDelegate(): Promise<CD>;
    /**
     * 指定されたデータベースに接続するためのコネクターのデリゲートインスタンスを解放する。
     *
     * @param connectorDelegate
     * @param errorOccurred エラーが発生したコネクターの場合はtrueを指定。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    abstract releaseConnectorDelegate(connectorDelegate: CD, errorOccurred: boolean): Promise<void>;
    /**
     * この接続プールを終了する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract end(): Promise<void>;
    private static _maximumNumberOfConnections;
    /**
     * 許容する最大接続数。
     */
    static get maximumNumberOfConnections(): number;
    private static pools;
    /**
     * 接続プールを開始する。
     *
     * @param maximumNumberOfConnections 許容する最大接続数。5がデフォルト。
     */
    static start(maximumNumberOfConnections?: number): void;
    /**
     * 指定されたデータベース接続パラメーターに対するプールを取得する。
     *
     * @param connectionParameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    static get(connectionParameters: {}): Pool<any, any, any> | undefined;
    /**
     * 指定されたデータベース接続パラメーターに対するプールをセットする。
     *
     * @param connectionParameters
     * @param pool
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    static put(connectionParameters: {}, pool: Pool<any, any, any>): void;
    /**
     * 接続プールを終了する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    static end(): Promise<void>;
    /**
     * それぞれのデータベース内部のエラーを元にDatabaseErrorを作成する。
     *
     * @param error
     * @returns
     */
    protected abstract createErrorFromInnerError(error: any): DatabaseError;
}
