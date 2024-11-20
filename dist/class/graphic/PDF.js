import PDFKit from "pdfkit";
import { MillimeterValue, GraphicalString as ParentGraphicalString, NW7Renderer as ParentNW7Renderer, JAN13Renderer as ParentJAN13Renderer, ByteArray } from "scent-typescript";
import { Writable } from "stream";
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
    constructor(fontPath, paperSize, marginTop, marginLeft) {
        this._color = "#000";
        this._fontSize = 12;
        /**
         * 行と行の間隔。
         */
        this.leading = 0;
        /**
         * 自動改行機能。
         */
        this.allowAutomaticLineFeed = true;
        /**
         * テキストの水平方向の配置。
         */
        this.textHorizontalPosition = "left";
        /**
         * テキストの垂直方向の配置。
         */
        this.textVerticalPosition = "top";
        /**
         * 最後に自動調整されたフォントサイズ。
         */
        this.lastAdjustedFontSize = undefined;
        this._lineWidth = 1;
        this.pdfkit = new PDFKit({ font: fontPath, size: paperSize });
        this.pdfkit.translate(MillimeterValue.from(marginLeft).toPoint(), MillimeterValue.from(marginTop).toPoint());
        this.pdfkit.fillColor(this._color);
        this.pdfkit.strokeColor(this._color);
        this._fontPath = fontPath;
        this.pdfkit.font(this._fontPath, this._fontSize);
        this.pdfkit.lineWidth(this._lineWidth);
    }
    /**
     * 描画色。
     */
    get color() {
        return this._color;
    }
    set color(color) {
        this._color = color;
        this.pdfkit.fillColor(color);
        this.pdfkit.strokeColor(color);
    }
    /**
     * フォントへのパス。
     */
    get fontPath() {
        return this._fontPath;
    }
    set fontPath(fontPath) {
        this._fontPath = fontPath;
        this.pdfkit.font(this._fontPath, this._fontSize);
    }
    /**
     * フォントサイズ。
     */
    get fontSize() {
        return this._fontSize;
    }
    set fontSize(fontSize) {
        this._fontSize = fontSize;
        this.pdfkit.font(this._fontPath, this._fontSize);
    }
    /**
     * 指定文字列のサイズを計測する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     *
     * @param text
     * @param maximumWidth 最大幅。
     * @param maximumHeight 最大高さ。
     * @returns
     */
    measureTextSize(text, maximumWidth, maximumHeight) {
        const renderer = new GraphicalString(text, this);
        if (maximumWidth) {
            renderer.maximumWidth = MillimeterValue.from(maximumWidth).toPoint();
        }
        if (maximumHeight) {
            renderer.maximumHeight = MillimeterValue.from(maximumHeight).toPoint();
        }
        const size = renderer.measureSize();
        this.lastAdjustedFontSize = renderer.lastAdjustedFontSize;
        return { width: MillimeterValue.fromPoint(size.width).value, height: MillimeterValue.fromPoint(size.height).value };
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
    printText(text, x, y, maximumWidth, maximumHeight) {
        const renderer = new GraphicalString(text, this);
        if (maximumWidth) {
            renderer.maximumWidth = MillimeterValue.from(maximumWidth).toPoint();
        }
        if (maximumHeight) {
            renderer.maximumHeight = MillimeterValue.from(maximumHeight).toPoint();
        }
        const size = renderer.fill(MillimeterValue.from(x).toPoint(), MillimeterValue.from(y).toPoint());
        this.lastAdjustedFontSize = renderer.lastAdjustedFontSize;
        return { width: MillimeterValue.fromPoint(size.width).value, height: MillimeterValue.fromPoint(size.height).value };
    }
    /**
     * 指定されたBoundsの中にテキストを描画する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     *
     * @param text
     * @param bounds
     * @returns 描画したテキストのサイズ。
     */
    printTextInBox(text, bounds) {
        const renderer = new GraphicalString(text, this);
        const millimeterBounds = {
            x: MillimeterValue.from(bounds.x).toPoint(),
            y: MillimeterValue.from(bounds.y).toPoint(),
            width: MillimeterValue.from(bounds.width).toPoint(),
            height: MillimeterValue.from(bounds.height).toPoint()
        };
        const size = renderer.fillInBox(millimeterBounds);
        this.lastAdjustedFontSize = renderer.lastAdjustedFontSize;
        return { width: MillimeterValue.fromPoint(size.width).value, height: MillimeterValue.fromPoint(size.height).value };
    }
    /**
     * 線の太さ。
     */
    get lineWidth() {
        return this._lineWidth;
    }
    set lineWidth(lineWidth) {
        this._lineWidth = lineWidth;
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
    }
    /**
     * 破線。
     */
    get lineDash() {
        return this._lineDash;
    }
    set lineDash(lineDash) {
        this._lineDash = lineDash;
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        }
        else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), { space: MillimeterValue.from(this.lineDash.space).toPoint() });
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
    printLine(startX, startY, endX, endY) {
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
    printHorizontalLine(startX, startY, length) {
        this.printLine(startX, startY, startX + length, startY);
    }
    /**
     * 指定位置に垂直方向の直線を描画する。
     *
     * @param startX
     * @param startY
     * @param length
     */
    printVerticalLine(startX, startY, length) {
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
    createRectanglePath(x, y, width, height, radius = 0) {
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
    printRectangleLine(x, y, width, height, radius = 0) {
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
    printRectangleFill(x, y, width, height, radius = 0) {
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
    createEllipsePath(x, y, width, height) {
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
    printEllipseLine(x, y, width, height) {
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
    printEllipseFill(x, y, width, height) {
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
    printImage(pathToImage, x, y, width, height) {
        const pointX = MillimeterValue.from(x).toPoint();
        const pointY = MillimeterValue.from(y).toPoint();
        let pointWidth = undefined;
        if (width) {
            pointWidth = MillimeterValue.from(width).toPoint();
        }
        let pointHeight = undefined;
        if (height) {
            pointHeight = MillimeterValue.from(height).toPoint();
        }
        if (typeof pointWidth !== "undefined" && typeof pointHeight !== "undefined") {
            this.pdfkit.image(pathToImage, pointX, pointY, { fit: [pointWidth, pointHeight], align: "center", valign: "center" });
        }
        else if (typeof pointWidth !== "undefined") {
            this.pdfkit.image(pathToImage, pointX, pointY, { width: pointWidth });
        }
        else if (typeof pointHeight !== "undefined") {
            this.pdfkit.image(pathToImage, pointX, pointY, { height: pointHeight });
        }
        else {
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
    printNW7(barcode, x, y, width, height) {
        const renderer = new NW7Renderer(barcode, this.pdfkit);
        renderer.render({ x: MillimeterValue.from(x).toPoint(), y: MillimeterValue.from(y).toPoint(), width: MillimeterValue.from(width).toPoint(), height: MillimeterValue.from(height).toPoint() });
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
    printJAN13(barcode, x, y, width, height) {
        const renderer = new JAN13Renderer(barcode, this.pdfkit);
        renderer.render({ x: MillimeterValue.from(x).toPoint(), y: MillimeterValue.from(y).toPoint(), width: MillimeterValue.from(width).toPoint(), height: MillimeterValue.from(height).toPoint() });
    }
    /**
     * PDFをバイト配列に変換する。
     *
     * @returns
     */
    async toByteArray() {
        let buffers = [];
        const writableStream = new Writable({
            write(chunk, encoding, callback) {
                buffers.push(chunk);
                callback();
            }
        });
        this.pdfkit.pipe(writableStream);
        this.pdfkit.end();
        return new Promise((resolve, reject) => {
            writableStream.on("finish", () => {
                resolve(ByteArray.from(Buffer.concat(buffers)));
            });
            writableStream.on("error", reject);
        });
    }
}
class GraphicalString extends ParentGraphicalString {
    constructor(string, pdf) {
        super(string, pdf.pdfkit);
        this.pdf = pdf;
        this.allowAutomaticLineFeed = pdf.allowAutomaticLineFeed;
        this.horizontalPosition = pdf.textHorizontalPosition;
        this.verticalPosition = pdf.textVerticalPosition;
        this.leading = MillimeterValue.from(pdf.leading).toPoint();
    }
    getFontSizeFromContext() {
        return this.pdf.fontSize;
    }
    setFontSizeToContext(fontSize) {
        this.pdf.fontSize = fontSize;
    }
    measureTextSize(text) {
        const width = this.context.widthOfString(text, { lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE });
        const height = this.context.heightOfString(text, { lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE });
        return { width, height };
    }
    fillText(text, x, y) {
        this.context.text(text, x, y, { lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE });
    }
}
class NW7Renderer extends ParentNW7Renderer {
    fillRectangle(context, x, y, width, height) {
        context.rect(x, y, width, height).fill();
    }
}
class JAN13Renderer extends ParentJAN13Renderer {
    fillRectangle(context, x, y, width, height) {
        context.rect(x, y, width, height).fill();
    }
}
