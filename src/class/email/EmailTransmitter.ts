import { createTransport } from "nodemailer";
import { StringObject } from "scent-typescript";

type RecipientType = "to" | "cc" | "bcc";

/**
 * nodemailerを使用してE-mailを送信するクラス。
 */
export default class EmailTransmitter {

    private _lineSeparator: string = "\r\n";

    /**
     * E-mail本文に使用する改行コード。"\r\n"がデフォルト。
     */
    public get lineSeparator(): string {
        return this._lineSeparator;
    }

    public set lineSeparator(lineSeparator: string) {
        this._lineSeparator = lineSeparator;
    }

    private _myAddress: string | null = null;

    /**
     * 送信元のE-mailアドレス。
     */
    public get myAddress(): string | null {
        return this._myAddress;
    }

    public set myAddress(myAddress: string) {
        this._myAddress = myAddress;
    }

    private _host: string | null = null;

    /**
     * E-mail送信を行うホスト。
     */
    public get host(): string | null {
        return this._host;
    }

    public set host(host: string) {
        this._host = host;
    }

    private _user: string | null = null;

    /**
     * ホストに認証を行うユーザー。
     */
    public get user(): string | null {
        return this._user;
    }

    public set user(user: string) {
        this._user = user;
    }

    private _password: string | null = null;

    /**
     * ホストに認証を行うパスワード。
     */
    public get password(): string | null {
        return this._password;
    }

    public set password(password: string) {
        this._password = password;
    }

    private _port: number = 587;

    /**
     * E-mail送信を行うポート番号。初期値は587番ポート。
     */
    public get port(): number {
        return this._port;
    }

    public set port(port: number) {
        this._port = port;
    }

    private _isEnableTLS: boolean = true;

    /**
     * ホストとの通信にTLSを使用する場合はtrue。
     */
    public get isEnableTLS(): boolean {
        return this.isEnableTLS;
    }

    public set isEnableTLS(isEnableTLS: boolean) {
        this._isEnableTLS = isEnableTLS;
    }

    private recipientAddresses: Record<RecipientType, string[]> = {"to": [], "cc": [], "bcc": []};

    /**
     * 受信者のE-mailアドレスを追加する。
     * 
     * @param recipientAddress 
     * @param recipientType 受信者のタイプ。"to"がデフォルト。
     */
    public addRecipientAddress(recipientAddress: string, recipientType: RecipientType = "to"): void {
        this.recipientAddresses[recipientType].push(recipientAddress);
    }

    /**
     * 受信者のE-mailアドレスを削除する。
     * 
     * @param recipientAddress 
     */
    public removeRecipientAddress(recipientAddress: string): void {
        Object.keys(this.recipientAddresses).forEach((recipientTypeString: string) => {
            const recipientType: RecipientType = <RecipientType> recipientTypeString;
            this.recipientAddresses[recipientType] = this.recipientAddresses[recipientType].filter((address: string) => StringObject.from(address).equals(recipientAddress) === false );
        });
    }

    private _isEnableDebug: boolean = false;

    /**
     * デバッグを有効にする場合はtrue。
     */
    public get isEnableDebug(): boolean {
        return this._isEnableDebug;
    }

    public set isEnableDebug(isEnableDebug: boolean) {
        this._isEnableDebug = isEnableDebug;
    }

    /**
     * 指定された表題と本文のE-mailを送信する。
     * 
     * @param subject 
     * @param body 
     */
    public async send(subject: string, body: string): Promise<void> {
        if (this._myAddress === null) {
            throw new Error("Sender address is not set.");
        }
        if (this._host === null) {
            throw new Error("Host is not set.");
        }
        if (this._user === null || this._password === null) {
            throw new Error("Authentication information is not set.");
        }
        if (this.recipientAddresses.to.length === 0) {
            throw new Error("Recipient address is not set.");
        }
        const transport = createTransport({
            host: this._host,
            port: this._port,
            requireTLS: this._isEnableTLS,
            auth: {
                user: this._user,
                pass: this._password
            },
            debug: this._isEnableDebug,
            logger: this._isEnableDebug
        });
        const text = new StringObject(body);
        text.replaceCrlf(this._lineSeparator);
        text.replaceCr(this._lineSeparator);
        text.replaceLf(this._lineSeparator);
        await transport.sendMail({
            from: this._myAddress,
            to: this.recipientAddresses.to,
            cc: this.recipientAddresses.cc,
            bcc: this.recipientAddresses.bcc,
            subject: subject,
            text: text.toString()
        });
    }
}
