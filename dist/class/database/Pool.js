import DatabaseError from "./DatabaseError.js";
/**
 * データベース接続をプールするためのクラス。
 *
 * @template D デリゲートの型。
 * @template C データベースに接続するためのパラメーターの型。
 * @template CD コネクターのデリゲートの型。
 */
class Pool {
    /**
     * コンストラクタ。
     *
     * @param delegate デリゲートインスタンス。
     * @param connectionParameters データベース接続に使用するパラメーター。
     */
    constructor(delegate, connectionParameters) {
        this.connectionParameters = connectionParameters;
        this.delegate = delegate;
    }
    /**
     * 許容する最大接続数。
     */
    static get maximumNumberOfConnections() {
        return this._maximumNumberOfConnections;
    }
    /**
     * 接続プールを開始する。
     *
     * @param maximumNumberOfConnections 許容する最大接続数。5がデフォルト。
     */
    static start(maximumNumberOfConnections = 5) {
        if (this.pools !== null) {
            return;
        }
        this.pools = new Map();
        this._maximumNumberOfConnections = maximumNumberOfConnections;
    }
    /**
     * 指定されたデータベース接続パラメーターに対するプールを取得する。
     *
     * @param connectionParameters
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    static get(connectionParameters) {
        if (this.pools === null) {
            throw new DatabaseError("Pool has not been started.");
        }
        const jsonOfParameters = JSON.stringify(connectionParameters);
        return this.pools.get(jsonOfParameters);
    }
    /**
     * 指定されたデータベース接続パラメーターに対するプールをセットする。
     *
     * @param connectionParameters
     * @param pool
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    static put(connectionParameters, pool) {
        if (this.pools === null) {
            throw new DatabaseError("Pool has not been started.");
        }
        const jsonOfParameters = JSON.stringify(connectionParameters);
        this.pools.set(jsonOfParameters, pool);
    }
    /**
     * 接続プールを終了する。
     *
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    static async end() {
        if (this.pools !== null) {
            let throwLater = null;
            for (const jsonOfParameters of this.pools.keys()) {
                try {
                    const pool = this.pools.get(jsonOfParameters);
                    if (typeof pool !== "undefined") {
                        await pool.end();
                        this.pools.delete(jsonOfParameters);
                    }
                }
                catch (error) {
                    throwLater = error;
                }
            }
            if (throwLater) {
                throw throwLater;
            }
            this.pools = null;
        }
    }
}
Pool.pools = null;
export default Pool;
