import PDFKit from "pdfkit";
import { Dimension, MillimeterValue, GraphicalString as ParentGraphicalString, NW7Renderer as ParentNW7Renderer, JAN13Renderer as ParentJAN13Renderer, StringObject, ByteArray, Bounds } from "scent-typescript";
import { Writable } from "stream";

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
    public constructor(fontPath: string, paperSize: PaperSize, marginTop: number, marginLeft: number) {
        this.pdfkit = new PDFKit({font: fontPath, size: paperSize});
        this.pdfkit.translate(MillimeterValue.from(marginLeft).toPoint(), MillimeterValue.from(marginTop).toPoint());
        this.pdfkit.fillColor(this._color);
        this.pdfkit.strokeColor(this._color);
        this._fontPath = fontPath;
        this.pdfkit.font(this._fontPath, this._fontSize);
        this.pdfkit.lineWidth(this._lineWidth);
    }

    public readonly pdfkit: PDFKit.PDFDocument;

    private _color: string = "#000";

    /**
     * 描画色。
     */
    public get color(): string {
        return this._color;
    }

    public set color(color: string) {
        this._color = color;
        this.pdfkit.fillColor(color);
        this.pdfkit.strokeColor(color);
    }

    private _fontPath: string;

    /**
     * フォントへのパス。
     */
    public get fontPath(): string {
        return this._fontPath;
    }

    public set fontPath(fontPath: string) {
        this._fontPath = fontPath;
        this.pdfkit.font(this._fontPath, this._fontSize);
    }

    private _fontSize: number = 12;

    /**
     * フォントサイズ。
     */
    public get fontSize(): number {
        return this._fontSize;
    }

    public set fontSize(fontSize: number) {
        this._fontSize = fontSize;
        this.pdfkit.font(this._fontPath, this._fontSize);
    }

    /**
     * 行と行の間隔。
     */
    public leading: number = 0;

    /**
     * 自動改行機能。
     */
    public allowAutomaticLineFeed: boolean = true;

    /**
     * テキストの水平方向の配置。
     */
    public textHorizontalPosition: HorizontalPosition = "left";

    /**
     * テキストの垂直方向の配置。
     */
    public textVerticalPosition: VerticalPosition = "top";

    /**
     * 最後に自動調整されたフォントサイズ。
     */
    public lastAdjustedFontSize: number | undefined = undefined;

    /**
     * 指定文字列のサイズを計測する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     * 
     * @param text
     * @param maximumWidth 最大幅。
     * @param maximumHeight 最大高さ。
     * @returns
     */
    public measureTextSize(text: string, maximumWidth?: number, maximumHeight?: number): Dimension {
        const renderer = new GraphicalString(text, this);
        if (maximumWidth) {
            renderer.maximumWidth = MillimeterValue.from(maximumWidth).toPoint();
        }
        if (maximumHeight) {
            renderer.maximumHeight = MillimeterValue.from(maximumHeight).toPoint();
        }
        const size = renderer.measureSize();
        this.lastAdjustedFontSize = renderer.lastAdjustedFontSize
        return {width: MillimeterValue.fromPoint(size.width).value, height: MillimeterValue.fromPoint(size.height).value};
    }

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
    public printText(text: string, x: number, y: number, maximumWidth?: number, maximumHeight?: number): Dimension {
        const renderer = new GraphicalString(text, this);
        if (maximumWidth) {
            renderer.maximumWidth = MillimeterValue.from(maximumWidth).toPoint();
        }
        if (maximumHeight) {
            renderer.maximumHeight = MillimeterValue.from(maximumHeight).toPoint();
        }
        const size = renderer.fill(MillimeterValue.from(x).toPoint(), MillimeterValue.from(y).toPoint());
        this.lastAdjustedFontSize = renderer.lastAdjustedFontSize
        return {width: MillimeterValue.fromPoint(size.width).value, height: MillimeterValue.fromPoint(size.height).value};
    }

    /**
     * 指定されたBoundsの中にテキストを描画する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     * 
     * @param text
     * @param bounds
     * @returns 描画したテキストのサイズ。
     */
    public printTextInBox(text: string, bounds: Bounds): Dimension {
        const renderer = new GraphicalString(text, this);
        const millimeterBounds: Bounds = {
            x: MillimeterValue.from(bounds.x).toPoint(),
            y: MillimeterValue.from(bounds.y).toPoint(),
            width: MillimeterValue.from(bounds.width).toPoint(),
            height: MillimeterValue.from(bounds.height).toPoint()
        }
        const size = renderer.fillInBox(millimeterBounds);
        this.lastAdjustedFontSize = renderer.lastAdjustedFontSize
        return {width: MillimeterValue.fromPoint(size.width).value, height: MillimeterValue.fromPoint(size.height).value};
    }

    private _lineWidth: number = 1;

    /**
     * 線の太さ。
     */
    public get lineWidth(): number {
        return this._lineWidth;
    }

    public set lineWidth(lineWidth: number) {
        this._lineWidth = lineWidth;
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
    }

    private _lineDash: {dash: number, space: number} | undefined;

    /**
     * 破線。
     */
    public get lineDash(): {dash: number, space: number} | undefined {
        return this._lineDash;
    }

    public set lineDash(lineDash: {dash: number, space: number} | undefined) {
        this._lineDash = lineDash;
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        } else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), {space: MillimeterValue.from(this.lineDash.space).toPoint()});
        }
    }

    /**
     * 指定位置に線を描画する。
     * 
     * @param startX 
     * @param startY 
     * @param endX 
     * @param endY 
     */
    public printLine(startX: number, startY: number, endX: number, endY: number) {
        this.pdfkit.moveTo(MillimeterValue.from(startX).toPoint(), MillimeterValue.from(startY).toPoint());
        this.pdfkit.lineTo(MillimeterValue.from(endX).toPoint(), MillimeterValue.from(endY).toPoint());
        this.pdfkit.stroke();
    }

    /**
     * 指定位置に水平方向の直線を描画する。
     * 
     * @param startX 
     * @param startY 
     * @param length 
     */
    public printHorizontalLine(startX: number, startY: number, length: number) {
        this.printLine(startX, startY, startX + length, startY);
    }

    /**
     * 指定位置に垂直方向の直線を描画する。
     * 
     * @param startX 
     * @param startY 
     * @param length 
     */
    public printVerticalLine(startX: number, startY: number, length: number) {
        this.printLine(startX, startY, startX, startY + length);
    }

    /**
     * 指定位置に矩形のパスを作成する。
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param radius 
     */
    private createRectanglePath(x: number, y: number, width: number, height: number, radius: number = 0) {
        this.pdfkit.moveTo(MillimeterValue.from(x + radius).toPoint(), MillimeterValue.from(y).toPoint());
        this.pdfkit.lineTo(MillimeterValue.from(x + width - radius).toPoint(), MillimeterValue.from(y).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x + width).toPoint(), MillimeterValue.from(y).toPoint(), MillimeterValue.from(x + width).toPoint(), MillimeterValue.from(y + radius).toPoint());
        this.pdfkit.lineTo(MillimeterValue.from(x + width).toPoint(), MillimeterValue.from(y + height - radius).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x + width).toPoint(), MillimeterValue.from(y + height).toPoint(), MillimeterValue.from(x + width - radius).toPoint(), MillimeterValue.from(y + height).toPoint());
        this.pdfkit.lineTo(MillimeterValue.from(x + radius).toPoint(), MillimeterValue.from(y + height).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x).toPoint(), MillimeterValue.from(y + height).toPoint(), MillimeterValue.from(x).toPoint(), MillimeterValue.from(y + height - radius).toPoint());
        this.pdfkit.lineTo(MillimeterValue.from(x).toPoint(), MillimeterValue.from(y + radius).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x).toPoint(), MillimeterValue.from(y).toPoint(), MillimeterValue.from(x + radius).toPoint(), MillimeterValue.from(y).toPoint());
    }

    /**
     * 指定位置に矩形の線を描画する。
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param radius
     */
    public printRectangleLine(x: number, y: number, width: number, height: number, radius: number = 0) {
        this.createRectanglePath(x, y, width, height, radius);
        this.pdfkit.stroke();
    }

    /**
     * 指定位置に塗りつぶした矩形を描画する。
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param radius
     */
    public printRectangleFill(x: number, y: number, width: number, height: number, radius: number = 0) {
        this.createRectanglePath(x, y, width, height, radius);
        this.pdfkit.fill();
    }

    /**
     * 指定位置に楕円形のパスを作成する。
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    private createEllipsePath(x: number, y: number, width: number, height: number) {
        this.pdfkit.moveTo(MillimeterValue.from(x + width / 2).toPoint(), MillimeterValue.from(y).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x + width).toPoint(), MillimeterValue.from(y).toPoint(), MillimeterValue.from(x + width).toPoint(), MillimeterValue.from(y + height / 2).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x + width).toPoint(), MillimeterValue.from(y + height).toPoint(), MillimeterValue.from(x + width / 2).toPoint(), MillimeterValue.from(y + height).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x).toPoint(), MillimeterValue.from(y + height).toPoint(), MillimeterValue.from(x).toPoint(), MillimeterValue.from(y + height / 2).toPoint());
        this.pdfkit.quadraticCurveTo(MillimeterValue.from(x).toPoint(), MillimeterValue.from(y).toPoint(), MillimeterValue.from(x + width / 2).toPoint(), MillimeterValue.from(y).toPoint());
    }

    /**
     * 指定位置に楕円形の線を描画する。
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    public printEllipseLine(x: number, y: number, width: number, height: number) {
        this.createEllipsePath(x, y, width, height);
        this.pdfkit.stroke();
    }

    /**
     * 指定位置に塗りつぶした楕円形を描画する。
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    public printEllipseFill(x: number, y: number, width: number, height: number) {
        this.createEllipsePath(x, y, width, height);
        this.pdfkit.fill();
    }

    /**
     * 指定された画像を描画する。
     * 
     * @param pathToImage 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    public printImage(pathToImage: string | Buffer, x: number, y: number, width?: number, height?: number) {
        const pointX = MillimeterValue.from(x).toPoint();
        const pointY = MillimeterValue.from(y).toPoint();
        let pointWidth: number | undefined = undefined;
        if (width) {
            pointWidth = MillimeterValue.from(width).toPoint();
        }
        let pointHeight: number | undefined = undefined;
        if (height) {
            pointHeight = MillimeterValue.from(height).toPoint();
        }
        if (typeof pointWidth !== "undefined" && typeof pointHeight !== "undefined") {
            this.pdfkit.image(pathToImage, pointX, pointY, {fit: [pointWidth, pointHeight], align: "center", valign: "center"});
        } else if (typeof pointWidth !== "undefined") {
            this.pdfkit.image(pathToImage, pointX, pointY, {width: pointWidth});
        } else if (typeof pointHeight !== "undefined") {
            this.pdfkit.image(pathToImage, pointX, pointY, {height: pointHeight});
        } else {
            this.pdfkit.image(pathToImage, pointX, pointY);
        }
    }

    /**
     * 指定された位置に指定された大きさでNW-7のバーコードを印刷する。
     * 
     * @param barcode 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    public printNW7(barcode: string, x: number, y: number, width: number, height: number) {
        const renderer = new NW7Renderer(barcode, this.pdfkit);
        renderer.render({x: MillimeterValue.from(x).toPoint(), y: MillimeterValue.from(y).toPoint(), width: MillimeterValue.from(width).toPoint(), height: MillimeterValue.from(height).toPoint()});
    }

    /**
     * 指定された位置に指定された大きさでJAN-13のバーコードを印刷する。
     * 
     * @param barcode 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    public printJAN13(barcode: string, x: number, y: number, width: number, height: number) {
        const renderer = new JAN13Renderer(barcode, this.pdfkit);
        renderer.render({x: MillimeterValue.from(x).toPoint(), y: MillimeterValue.from(y).toPoint(), width: MillimeterValue.from(width).toPoint(), height: MillimeterValue.from(height).toPoint()});
    }

    /**
     * PDFをバイト配列に変換する。
     * 
     * @returns 
     */
    public async toByteArray(): Promise<ByteArray> {
        let buffers: Uint8Array[] = [];
        const writableStream = new Writable({
            write(chunk, encoding, callback) {
              buffers.push(chunk);
              callback();
            }
        });
        this.pdfkit.pipe(writableStream);
        this.pdfkit.end();
        return new Promise<ByteArray>((resolve, reject) => {
            writableStream.on("finish", () => {
                resolve(ByteArray.from(Buffer.concat(buffers)));
            });
            writableStream.on("error", reject);
        });
    }
}

class GraphicalString extends ParentGraphicalString<typeof PDFKit> {

    public constructor(string: string, pdf: PDF) {
        super(string, pdf.pdfkit);
        this.pdf = pdf;
        this.allowAutomaticLineFeed = pdf.allowAutomaticLineFeed;
        this.horizontalPosition = pdf.textHorizontalPosition;
        this.verticalPosition = pdf.textVerticalPosition;
        this.leading = MillimeterValue.from(pdf.leading).toPoint();
    }

    private readonly pdf: PDF;

    protected getFontSizeFromContext(): number {
        return this.pdf.fontSize;
    }

    protected setFontSizeToContext(fontSize: number): void {
        this.pdf.fontSize = fontSize;
    }

    protected measureTextSize(text: string): Dimension {
        const width = this.context.widthOfString(text, {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE});
        const height = this.context.heightOfString(text, {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE});
        return {width, height};
    }

    protected fillText(text: string, x: number, y: number): void {
        this.context.text(text, x, y, {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE});
    }
}

class NW7Renderer extends ParentNW7Renderer<typeof PDFKit> {

    protected fillRectangle(context: PDFKit.PDFDocument, x: number, y: number, width: number, height: number): void {
        context.rect(x, y, width, height).fill();
    }
}

class JAN13Renderer extends ParentJAN13Renderer<typeof PDFKit> {

    protected fillRectangle(context: PDFKit.PDFDocument, x: number, y: number, width: number, height: number): void {
        context.rect(x, y, width, height).fill();
    }
}
