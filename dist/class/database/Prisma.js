import { PrismaClient } from "@prisma/client";
import { StringObject } from "scent-typescript";
/**
 * PrismaClientのクラス。
 */
export default class Prisma extends PrismaClient {
    /**
     * 一意のPrismaインスタンスを取得する。
     *
     * @returns
     */
    static getInstance() {
        if (typeof window === "undefined" && typeof Prisma.instance === "undefined") {
            this.instance = new Prisma();
        }
        return Prisma.instance;
    }
    /**
     * 指定されたErrorインスタンスからエラーメッセージを作成する。
     *
     * @param error
     * @returns
     */
    static makeErrorMessage(error) {
        const message = new StringObject("Database processing failed.");
        if (typeof error.code !== "undefined") {
            message.append(" Error code is ");
            message.append(error.code);
            message.append(".");
        }
        else {
            message.append(" Unknown error.");
        }
        return message.toString();
    }
}
