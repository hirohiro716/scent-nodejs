import { PrismaClient } from "@prisma/client";
/**
 * PrismaClientのクラス。
 */
export default class Prisma extends PrismaClient {
    private static instance;
    /**
     * 一意のPrismaインスタンスを取得する。
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
