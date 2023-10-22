import { PrismaClient } from "@prisma/client";
/**
 * PrismaClientオブジェクト。
 */
export default class Prisma extends PrismaClient {
    private static instance;
    /**
     * 一意のPrismaオブジェクトを取得する。
     *
     * @returns
     */
    static getInstance(): Prisma;
    /**
     * 指定されたErrorインスタンスからエラーメッセージを作成する。
     *
     * @param error
     * @returns
     */
    static makeErrorMessage(error: any): string;
}
