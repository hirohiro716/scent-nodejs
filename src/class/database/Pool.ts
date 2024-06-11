import { json } from "stream/consumers";
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
    protected constructor(delegate: D, connectionParameters: C) {
        this.connectionParameters = connectionParameters;
        this.delegate = delegate;
    }

    /**
     * 各データベース固有のプールインスタンス。
     */
    public readonly delegate: D;

    /**
     * データベース接続に使用するパラメーター。
     */
    public readonly connectionParameters: C;

    /**
     * データベースに接続するためのコネクターのデリゲートインスタンスを取得する。
     * 
     * @returns
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract borrowConnectorDelegate(): Promise<CD>;

    /**
     * 指定されたデータベースに接続するためのコネクターのデリゲートインスタンスを解放する。
     * 
     * @param connectorDelegate
     * @param errorOccurred エラーが発生したコネクターの場合はtrueを指定。
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public abstract releaseConnectorDelegate(connectorDelegate: CD, errorOccurred: boolean): Promise<void>;

    /**
     * この接続プールを終了する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    protected abstract end(): Promise<void>;

    private static _maximumNumberOfConnections: number;

    /**
     * 許容する最大接続数。
     */
    public static get maximumNumberOfConnections(): number {
        return this._maximumNumberOfConnections;
    }
    
    private static pools: Map<string, Pool<any, any, any>> | null = null;

    /**
     * 接続プールを開始する。
     * 
     * @param maximumNumberOfConnections 許容する最大接続数。5がデフォルト。
     */
    public static start(maximumNumberOfConnections: number = 5): void {
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
    public static get(connectionParameters: {}): Pool<any, any, any> | undefined {
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
    public static put(connectionParameters: {}, pool: Pool<any, any, any>): void {
        if (this.pools === null) {
            throw new DatabaseError("Pool has not been started.");
        }
        const jsonOfParameters = JSON.stringify(connectionParameters);
        this.pools.set(jsonOfParameters, pool);
    }

    // /**
    //  * 指定されたデータベース接続パラメーターに対するプールを削除する。
    //  * 
    //  * @param connectionParameters 
    //  * @throws DatabaseError データベースの処理に失敗した場合。
    //  */
    // public static remove(connectionParameters: {}): void {
    //     if (this.pools === null) {
    //         throw new DatabaseError("Pool has not been started.");
    //     }
    //     const jsonOfParameters = JSON.stringify(connectionParameters);
    //     this.pools.delete(jsonOfParameters);
    // }
    // TODO:

    /**
     * 接続プールを終了する。
     * 
     * @throws DatabaseError データベースの処理に失敗した場合。
     */
    public static async end(): Promise<void> {
        if (this.pools !== null) {
            let throwLater: Error | null = null;
            for (const jsonOfParameters of this.pools.keys()) {
                try {
                    const pool = this.pools.get(jsonOfParameters);
                    if (typeof pool !== "undefined") {
                        await pool.end();
                        this.pools.delete(jsonOfParameters);
                    }
                } catch (error: any) {
                    throwLater = error;
                }
            }
            if (throwLater) {
                throw throwLater;
            }
            this.pools = null;
        }
    }

    /**
     * それぞれのデータベース内部のエラーを元にDatabaseErrorを作成する。
     * 
     * @param error 
     * @returns
     */
    protected abstract createErrorFromInnerError(error: any): DatabaseError;
}