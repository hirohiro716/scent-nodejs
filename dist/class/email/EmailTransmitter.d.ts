type RecipientType = "to" | "cc" | "bcc";
/**
 * nodemailerを使用してE-mailを送信するクラス。
 */
export default class EmailTransmitter {
    private _lineSeparator;
    /**
     * E-mail本文に使用する改行コード。"\r\n"がデフォルト。
     */
    get lineSeparator(): string;
    set lineSeparator(lineSeparator: string);
    private _myAddress;
    /**
     * 送信元のE-mailアドレス。
     */
    get myAddress(): string | null;
    set myAddress(myAddress: string);
    private _host;
    /**
     * E-mail送信を行うホスト。
     */
    get host(): string | null;
    set host(host: string);
    private _user;
    /**
     * ホストに認証を行うユーザー。
     */
    get user(): string | null;
    set user(user: string);
    private _password;
    /**
     * ホストに認証を行うパスワード。
     */
    get password(): string | null;
    set password(password: string);
    private _port;
    /**
     * E-mail送信を行うポート番号。初期値は587番ポート。
     */
    get port(): number;
    set port(port: number);
    private _isEnableTLS;
    /**
     * ホストとの通信にTLSを使用する場合はtrue。
     */
    get isEnableTLS(): boolean;
    set isEnableTLS(isEnableTLS: boolean);
    private recipientAddresses;
    /**
     * 受信者のE-mailアドレスを追加する。
     *
     * @param recipientAddress
     * @param recipientType 受信者のタイプ。"to"がデフォルト。
     */
    addRecipientAddress(recipientAddress: string, recipientType?: RecipientType): void;
    /**
     * 受信者のE-mailアドレスを削除する。
     *
     * @param recipientAddress
     */
    removeRecipientAddress(recipientAddress: string): void;
    private _isEnableDebug;
    /**
     * デバッグを有効にする場合はtrue。
     */
    get isEnableDebug(): boolean;
    set isEnableDebug(isEnableDebug: boolean);
    /**
     * 指定された表題と本文のE-mailを送信する。
     *
     * @param subject
     * @param body
     */
    send(subject: string, body: string): Promise<void>;
}
export {};
