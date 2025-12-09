import { Datetime, RecordMap, StringObject } from "scent-typescript";
import SingleRecordBinder from "./database/SingleRecordBinder.js";
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
        this.data.set(this.getPropertyOfToken().physicalName, token.toString());
        return token.toString();
    }
    /**
     * 指定されたトークン文字列と前回発行したトークンが一致する場合はtrueを返す。
     *
     * @param token
     */
    async isValidTokenString(token) {
        let result = false;
        if (typeof this._id !== "undefined" && typeof this._data !== "undefined" && token.length > 0) {
            result = StringObject.from(this._data.get(this.getPropertyOfToken().physicalName)).equals(token);
            this._data.delete(this.getPropertyOfToken().physicalName);
            await this.deleteFromStorage(this._id);
            await this.saveToStorage(this._id, JSON.stringify(Object.fromEntries(this._data)));
        }
        return result;
    }
    /**
     * 指定された編集開始時のデータベースレコードから期限切れを取り除く。
     *
     * @param preEditRecords
     */
    removeExpiredPreEditRecords(preEditRecords) {
        const propertyOfPreEditRecordExpirationDates = this.getPropertyOfPreEditRecordExpirationDates();
        if (propertyOfPreEditRecordExpirationDates) {
            const expirationDates = { ...this.data.get(propertyOfPreEditRecordExpirationDates.physicalName) };
            for (const tableName of Object.keys({ ...expirationDates })) {
                for (const whereSetObject of Object.keys(expirationDates[tableName])) {
                    const limit = StringObject.from(expirationDates[tableName][whereSetObject]).toDatetime();
                    if (limit === null || limit.getAllMilliseconds() < Datetime.from().getAllMilliseconds()) {
                        delete expirationDates[tableName][whereSetObject];
                        delete preEditRecords[tableName][whereSetObject];
                    }
                }
            }
        }
    }
    /**
     * 指定されたRecordBinderインスタンスの編集開始時のレコードをセッションに格納する。
     * 格納されたレコードはRecordBinderインスタンスで更新する際のコンフリクト確認に使用される。
     *
     * @param recordBinder
     */
    setPreEditRecords(recordBinder) {
        const preEditRecords = { ...this.data.get(this.getPropertyOfPreEditRecords().physicalName) };
        this.removeExpiredPreEditRecords(preEditRecords);
        const table = recordBinder.getTable();
        if (Object.keys(preEditRecords).includes(table.physicalName) === false) {
            preEditRecords[table.physicalName] = {};
        }
        const whereSetStringObject = new StringObject();
        if (recordBinder.whereSet !== null) {
            recordBinder.whereSet.sort();
            whereSetStringObject.append(JSON.stringify(recordBinder.whereSet.toObject()));
        }
        preEditRecords[table.physicalName][whereSetStringObject.toString()] = null;
        if (recordBinder.preEditRecords !== null) {
            preEditRecords[table.physicalName][whereSetStringObject.toString()] = RecordMap.toObjects(recordBinder.preEditRecords);
        }
        this.data.set(this.getPropertyOfPreEditRecords().physicalName, preEditRecords);
        const propertyOfPreEditRecordExpirationDates = this.getPropertyOfPreEditRecordExpirationDates();
        const preEditRecordValidityHours = this.getPreEditRecordValidityHours();
        if (propertyOfPreEditRecordExpirationDates && preEditRecordValidityHours) {
            const expirationDates = { ...this.data.get(propertyOfPreEditRecordExpirationDates.physicalName) };
            if (Object.keys(expirationDates).includes(table.physicalName) === false) {
                expirationDates[table.physicalName] = {};
            }
            const limitDatetime = Datetime.from().addHour(preEditRecordValidityHours);
            expirationDates[table.physicalName][whereSetStringObject.toString()] = limitDatetime.toString();
            this.data.set(propertyOfPreEditRecordExpirationDates.physicalName, expirationDates);
        }
    }
    /**
     * 指定されたRecordBinderインスタンスにセッションに格納されている編集開始時のレコードを適用する。
     * 復元されたレコードはRecordBinderインスタンスで更新する際のコンフリクト確認に使用される。
     *
     * @param recordBinder
     */
    applyPreEditRecords(recordBinder) {
        recordBinder.preEditRecords = [];
        const preEditRecords = { ...this.data.get(this.getPropertyOfPreEditRecords().physicalName) };
        this.removeExpiredPreEditRecords(preEditRecords);
        const table = recordBinder.getTable();
        if (Object.keys(preEditRecords).includes(table.physicalName) === false) {
            preEditRecords[table.physicalName] = {};
        }
        const whereSetStringObject = new StringObject();
        if (recordBinder.whereSet !== null) {
            recordBinder.whereSet.sort();
            whereSetStringObject.append(JSON.stringify(recordBinder.whereSet.toObject()));
        }
        if (Object.keys(preEditRecords[table.physicalName]).includes(whereSetStringObject.toString()) === false) {
            preEditRecords[table.physicalName][whereSetStringObject.toString()] = [];
        }
        const preEditRecordObjects = preEditRecords[recordBinder.getTable().physicalName][whereSetStringObject.toString()];
        if (preEditRecordObjects !== null) {
            recordBinder.preEditRecords = [];
            for (const preEditRecordObject of preEditRecordObjects) {
                const record = table.createRecord(preEditRecordObject);
                recordBinder.preEditRecords.push(record);
                if (recordBinder.records.length === 0 && recordBinder instanceof SingleRecordBinder) {
                    recordBinder.record = record.clone();
                    break;
                }
            }
        }
    }
}
