import PDFKit from "pdfkit";
import { MillimeterValue, NW7Renderer as ParentNW7Renderer, JAN13Renderer as ParentJAN13Renderer, StringObject, ByteArray } from "scent-typescript";
import { Writable } from "stream";
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
    constructor(pathToFont, paperSize) {
        /**
         * PDFドキュメントの上余白。
         */
        this.marginTop = 0;
        /**
         * PDFドキュメントの左余白。
         */
        this.marginLeft = 0;
        /**
         * 描画色。
         */
        this.color = "#000";
        /**
         * フォントサイズ。
         */
        this.fontSize = 12;
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
        /**
         * 線の太さ。
         */
        this.lineWidth = 1;
        /**
         * 破線。
         */
        this.lineDash = undefined;
        this.pathToFont = pathToFont;
        this.pdfkit = new PDFKit({ font: pathToFont, size: paperSize });
    }
    /**
     * 指定文字列を描画するレイアウトを作成する。
     *
     * @param text
     * @param maximumWidth 最大幅。
     * @param maximumHeight 最大高さ。
     * @returns
     */
    createLayout(text, maximumWidth, maximumHeight) {
        this.pdfkit.font(this.pathToFont, this.fontSize);
        let fontSize = this.fontSize;
        let lines = [];
        let layout;
        while (typeof layout === "undefined") {
            let line = new StringObject();
            for (let index = 0; index < text.length; index++) {
                const one = new StringObject(text).extract(index, index + 1);
                const width = MillimeterValue.fromPoint(this.pdfkit.widthOfString(line.clone().append(one).toString())).value;
                if (this.allowAutomaticLineFeed && typeof maximumWidth !== "undefined" && maximumWidth < width || one.equals("\n")) {
                    if (line.length() > 0) {
                        lines.push(line.toString());
                    }
                    line = one.replaceLF("");
                }
                else {
                    line.append(one);
                }
            }
            lines.push(line.toString());
            let width = 0;
            let height = 0;
            for (const line of lines) {
                const lineWidth = MillimeterValue.fromPoint(this.pdfkit.widthOfString(line)).value;
                if (width < lineWidth) {
                    width = lineWidth;
                }
                if (height > 0 && this.leading) {
                    height += this.leading;
                }
                height += MillimeterValue.fromPoint(this.pdfkit.heightOfString(line)).value;
            }
            let laidout = true;
            if (fontSize > 1) {
                if (maximumWidth && maximumWidth < width) {
                    laidout = false;
                }
                if (maximumHeight && maximumHeight < height) {
                    laidout = false;
                }
            }
            if (laidout) {
                layout = { lines: lines, fontSize: fontSize, width: width, height: height };
                break;
            }
            lines = [];
            fontSize -= 0.5;
            this.pdfkit.font(this.pathToFont, fontSize);
        }
        this.lastAdjustedFontSize = layout.fontSize;
        return layout;
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
        let width = 0;
        let height = 0;
        const layout = this.createLayout(text, maximumWidth, maximumHeight);
        if (typeof layout !== "undefined") {
            width = layout.width;
            height = layout.height;
        }
        return { width: width, height: height };
    }
    /**
     * 指定された一行のテキストを描画して塗りつぶす。
     *
     * @param oneLine
     * @param x
     * @param y
     * @param maximumWidth
     * @returns 描画したテキストのサイズ。
     */
    printOneLine(oneLine, x, y, maximumWidth) {
        const metrics = this.measureTextSize(oneLine, maximumWidth);
        let filledX = x;
        switch (this.textHorizontalPosition) {
            case "left":
                this.pdfkit.text(oneLine, MillimeterValue.from(filledX).toPoint(), MillimeterValue.from(y).toPoint());
                break;
            case "center":
                if (maximumWidth) {
                    filledX += maximumWidth / 2;
                }
                filledX -= metrics.width / 2;
                this.pdfkit.text(oneLine, MillimeterValue.from(filledX).toPoint(), MillimeterValue.from(y).toPoint());
                break;
            case "right":
                if (maximumWidth) {
                    filledX += maximumWidth;
                }
                filledX -= metrics.width;
                this.pdfkit.text(oneLine, MillimeterValue.from(filledX).toPoint(), MillimeterValue.from(y).toPoint());
                break;
        }
        let leading = this.leading;
        if (typeof leading === "undefined") {
            leading = 0;
        }
        const height = metrics.height;
        return { width: metrics.width, height: height + leading };
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
        this.pdfkit.fillColor(this.color);
        let width = 0;
        let height = 0;
        const layout = this.createLayout(text, maximumWidth, maximumHeight);
        if (typeof layout !== "undefined") {
            let filledY = y;
            let filledX = x;
            switch (this.textVerticalPosition) {
                case "top":
                    for (const line of layout.lines) {
                        const dimension = this.printOneLine(line, filledX, filledY);
                        filledY += dimension.height;
                    }
                    break;
                case "middle":
                    if (maximumHeight) {
                        filledY += maximumHeight / 2;
                    }
                    filledY -= layout.height / 2;
                    for (const line of layout.lines) {
                        const dimension = this.printOneLine(line, filledX, filledY);
                        filledY += dimension.height;
                    }
                    break;
                case "bottom":
                    if (maximumHeight) {
                        filledY += maximumHeight;
                    }
                    filledY -= layout.height;
                    for (const line of layout.lines) {
                        const dimension = this.printOneLine(line, filledX, filledY);
                        filledY += dimension.height;
                    }
                    break;
            }
            width = layout.width;
            height = layout.height;
        }
        return { width: width, height: height };
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
        this.pdfkit.strokeColor(this.color);
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        }
        else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), { space: MillimeterValue.from(this.lineDash.space).toPoint() });
        }
        this.pdfkit.moveTo(MillimeterValue.from(startX).toPoint(), MillimeterValue.from(startY).toPoint());
        this.pdfkit.lineTo(MillimeterValue.from(endX).toPoint(), MillimeterValue.from(endY).toPoint());
        this.pdfkit.stroke(this.color);
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
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        }
        else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), { space: MillimeterValue.from(this.lineDash.space).toPoint() });
        }
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
        this.pdfkit.strokeColor(this.color);
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
        this.pdfkit.fillColor(this.color);
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
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        }
        else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), { space: MillimeterValue.from(this.lineDash.space).toPoint() });
        }
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
        this.pdfkit.strokeColor(this.color);
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
        this.pdfkit.fillColor(this.color);
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
        this.pdfkit.fillColor(this.color);
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
        this.pdfkit.fillColor(this.color);
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
