import { createTransport } from "nodemailer";
import { StringObject } from "scent-typescript";
/**
 * nodemailerを使用してE-mailを送信するクラス。
 */
export default class EmailTransmitter {
    constructor() {
        this._lineSeparator = "\r\n";
        this._myAddress = null;
        this._host = null;
        this._user = null;
        this._password = null;
        this._port = 587;
        this._isEnableTLS = true;
        this.recipientAddresses = { "to": [], "cc": [], "bcc": [] };
        this._isEnableDebug = false;
    }
    /**
     * E-mail本文に使用する改行コード。"\r\n"がデフォルト。
     */
    get lineSeparator() {
        return this._lineSeparator;
    }
    set lineSeparator(lineSeparator) {
        this._lineSeparator = lineSeparator;
    }
    /**
     * 送信元のE-mailアドレス。
     */
    get myAddress() {
        return this._myAddress;
    }
    set myAddress(myAddress) {
        this._myAddress = myAddress;
    }
    /**
     * E-mail送信を行うホスト。
     */
    get host() {
        return this._host;
    }
    set host(host) {
        this._host = host;
    }
    /**
     * ホストに認証を行うユーザー。
     */
    get user() {
        return this._user;
    }
    set user(user) {
        this._user = user;
    }
    /**
     * ホストに認証を行うパスワード。
     */
    get password() {
        return this._password;
    }
    set password(password) {
        this._password = password;
    }
    /**
     * E-mail送信を行うポート番号。初期値は587番ポート。
     */
    get port() {
        return this._port;
    }
    set port(port) {
        this._port = port;
    }
    /**
     * ホストとの通信にTLSを使用する場合はtrue。
     */
    get isEnableTLS() {
        return this.isEnableTLS;
    }
    set isEnableTLS(isEnableTLS) {
        this._isEnableTLS = isEnableTLS;
    }
    /**
     * 受信者のE-mailアドレスを追加する。
     *
     * @param recipientAddress
     * @param recipientType 受信者のタイプ。"to"がデフォルト。
     */
    addRecipientAddress(recipientAddress, recipientType = "to") {
        this.recipientAddresses[recipientType].push(recipientAddress);
    }
    /**
     * 受信者のE-mailアドレスを削除する。
     *
     * @param recipientAddress
     */
    removeRecipientAddress(recipientAddress) {
        Object.keys(this.recipientAddresses).forEach((recipientTypeString) => {
            const recipientType = recipientTypeString;
            this.recipientAddresses[recipientType] = this.recipientAddresses[recipientType].filter((address) => StringObject.from(address).equals(recipientAddress) === false);
        });
    }
    /**
     * デバッグを有効にする場合はtrue。
     */
    get isEnableDebug() {
        return this._isEnableDebug;
    }
    set isEnableDebug(isEnableDebug) {
        this._isEnableDebug = isEnableDebug;
    }
    /**
     * 指定された表題と本文のE-mailを送信する。
     *
     * @param subject
     * @param body
     */
    async send(subject, body) {
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
        text.replaceCRLF(this._lineSeparator);
        text.replaceCR(this._lineSeparator);
        text.replaceLF(this._lineSeparator);
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
