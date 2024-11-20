import { Dimension, ByteArray, Bounds } from "scent-typescript";
type PaperSize = "A3" | "A4" | "A5" | "A6" | "B4" | "B5" | "B6";
type VerticalPosition = "top" | "middle" | "bottom";
type HorizontalPosition = "left" | "center" | "right";
/**
 * PDFのクラス。このクラスではミリメートル単位で長さを指定する。
 */
export default class PDF {
    /**
     * コンストラクタ。日本語フォントへのパス、用紙サイズ、余白を指定する。
     *
     * @param fontPath
     * @param paperSize
     * @param marginTop
     * @param marginLeft
     */
    constructor(fontPath: string, paperSize: PaperSize, marginTop: number, marginLeft: number);
    readonly pdfkit: PDFKit.PDFDocument;
    private _color;
    /**
     * 描画色。
     */
    get color(): string;
    set color(color: string);
    private _fontPath;
    /**
     * フォントへのパス。
     */
    get fontPath(): string;
    set fontPath(fontPath: string);
    private _fontSize;
    /**
     * フォントサイズ。12が初期値。
     */
    get fontSize(): number;
    set fontSize(fontSize: number);
    /**
     * 行と行の間隔。0が初期値。
     */
    leading: number;
    /**
     * 文字列の自動改行が許可されている場合はtrue。trueが初期値。
     */
    allowAutomaticLineFeed: boolean;
    /**
     * テキストの水平方向の配置。"left"が初期値。
     */
    textHorizontalPosition: HorizontalPosition;
    /**
     * テキストの垂直方向の配置。"top"が初期値。
     */
    textVerticalPosition: VerticalPosition;
    /**
     * 最後に自動調整されたフォントサイズ。
     */
    lastAdjustedFontSize: number | undefined;
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
     * 指定されたBoundsの中にテキストを描画する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     *
     * @param text
     * @param bounds
     * @returns 描画したテキストのサイズ。
     */
    printTextInBox(text: string, bounds: Bounds): Dimension;
    private _lineWidth;
    /**
     * 線の太さ。
     */
    get lineWidth(): number;
    set lineWidth(lineWidth: number);
    private _lineDash;
    /**
     * 破線。
     */
    get lineDash(): {
        dash: number;
        space: number;
    } | undefined;
    set lineDash(lineDash: {
        dash: number;
        space: number;
    } | undefined);
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
