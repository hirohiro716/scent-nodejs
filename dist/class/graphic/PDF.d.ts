import { Dimension, ByteArray } from "scent-typescript";
type PaperSize = "A3" | "A4" | "A5" | "A6" | "B4" | "B5" | "B6";
type VerticalPosition = "top" | "middle" | "bottom";
type HorizontalPosition = "left" | "center" | "right";
/**
 * PDFのクラス。このクラスではミリメートル単位で長さを指定する。
 */
export default class PDF {
    /**
     * コンストラクタ。日本語フォントへのパスと用紙サイズを指定する。
     *
     * @param pathToFont
     * @param paperSize
     */
    constructor(pathToFont: string, paperSize: PaperSize);
    private readonly pdfkit;
    /**
     * PDFドキュメントの上余白。
     */
    marginTop: number;
    /**
     * PDFドキュメントの左余白。
     */
    marginLeft: number;
    /**
     * 描画色。
     */
    color: string;
    /**
     * フォントへのパス。
     */
    pathToFont: string;
    /**
     * フォントサイズ。
     */
    fontSize: number;
    /**
     * 行と行の間隔。
     */
    leading: number;
    /**
     * 自動改行機能。
     */
    allowAutomaticLineFeed: boolean;
    /**
     * テキストの水平方向の配置。
     */
    textHorizontalPosition: HorizontalPosition;
    /**
     * テキストの垂直方向の配置。
     */
    textVerticalPosition: VerticalPosition;
    /**
     * 最後に自動調整されたフォントサイズ。
     */
    lastAdjustedFontSize: number | undefined;
    /**
     * 指定文字列を描画するレイアウトを作成する。
     *
     * @param text
     * @param maximumWidth 最大幅。
     * @param maximumHeight 最大高さ。
     * @returns
     */
    private createLayout;
    /**
     * 指定文字列のサイズを計測する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     *
     * @param text
     * @param maximumWidth 最大幅。
     * @param maximumHeight 最大高さ。
     * @returns
     */
    measureTextSize(text: string, maximumWidth?: number, maximumHeight?: number): Dimension;
    /**
     * 指定された一行のテキストを描画して塗りつぶす。
     *
     * @param oneLine
     * @param x
     * @param y
     * @param maximumWidth
     * @returns 描画したテキストのサイズ。
     */
    private printOneLine;
    /**
     * 指定された位置にテキストを描画する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     *
     * @param text
     * @param x
     * @param y
     * @param maximumWidth
     * @param maximumHeight
     * @returns 描画したテキストのサイズ。
     */
    printText(text: string, x: number, y: number, maximumWidth?: number, maximumHeight?: number): Dimension;
    /**
     * 線の太さ。
     */
    lineWidth: number;
    /**
     * 破線。
     */
    lineDash: {
        dash: number;
        space: number;
    } | undefined;
    /**
     * 指定位置に線を描画する。
     *
     * @param startX
     * @param startY
     * @param endX
     * @param endY
     */
    printLine(startX: number, startY: number, endX: number, endY: number): void;
    /**
     * 指定位置に水平方向の直線を描画する。
     *
     * @param startX
     * @param startY
     * @param length
     */
    printHorizontalLine(startX: number, startY: number, length: number): void;
    /**
     * 指定位置に垂直方向の直線を描画する。
     *
     * @param startX
     * @param startY
     * @param length
     */
    printVerticalLine(startX: number, startY: number, length: number): void;
    /**
     * 指定位置に矩形のパスを作成する。
     *
     * @param x
     * @param y
     * @param width
     * @param height
     * @param radius
     */
    private createRectanglePath;
    /**
     * 指定位置に矩形の線を描画する。
     *
     * @param x
     * @param y
     * @param width
     * @param height
     * @param radius
     */
    printRectangleLine(x: number, y: number, width: number, height: number, radius?: number): void;
    /**
     * 指定位置に塗りつぶした矩形を描画する。
     *
     * @param x
     * @param y
     * @param width
     * @param height
     * @param radius
     */
    printRectangleFill(x: number, y: number, width: number, height: number, radius?: number): void;
    /**
     * 指定位置に楕円形のパスを作成する。
     *
     * @param x
     * @param y
     * @param width
     * @param height
     */
    private createEllipsePath;
    /**
     * 指定位置に楕円形の線を描画する。
     *
     * @param x
     * @param y
     * @param width
     * @param height
     */
    printEllipseLine(x: number, y: number, width: number, height: number): void;
    /**
     * 指定位置に塗りつぶした楕円形を描画する。
     *
     * @param x
     * @param y
     * @param width
     * @param height
     */
    printEllipseFill(x: number, y: number, width: number, height: number): void;
    /**
     * 指定された画像を描画する。
     *
     * @param pathToImage
     * @param x
     * @param y
     * @param width
     * @param height
     */
    printImage(pathToImage: string | Buffer, x: number, y: number, width?: number, height?: number): void;
    /**
     * 指定された位置に指定された大きさでNW-7のバーコードを印刷する。
     *
     * @param barcode
     * @param x
     * @param y
     * @param width
     * @param height
     */
    printNW7(barcode: string, x: number, y: number, width: number, height: number): void;
    /**
     * 指定された位置に指定された大きさでJAN-13のバーコードを印刷する。
     *
     * @param barcode
     * @param x
     * @param y
     * @param width
     * @param height
     */
    printJAN13(barcode: string, x: number, y: number, width: number, height: number): void;
    /**
     * PDFをバイト配列に変換する。
     *
     * @returns
     */
    toByteArray(): Promise<ByteArray>;
}
export {};
