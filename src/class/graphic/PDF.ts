import PDFKit from "pdfkit";
import { Dimension, MillimeterValue, NW7Renderer as ParentNW7Renderer, JAN13Renderer as ParentJAN13Renderer, StringObject, ByteArray, Bounds } from "scent-typescript";
import { Writable } from "stream";

type PaperSize = "A3" | "A4" | "A5" | "A6" | "B4" | "B5" | "B6";

type VerticalPosition = "top" | "middle" | "bottom";

type HorizontalPosition = "left" | "center" | "right";

type Layout = {
    lines: string[],
    width: number,
    height: number,
    fontSize: number
}

/**
 * PDFのクラス。このクラスではミリメートル単位で長さを指定する。
 */
export default class PDF {

    /**
     * コンストラクタ。日本語フォントへのパス、用紙サイズ、余白を指定する。
     * 
     * @param pathToFont 
     * @param paperSize
     * @param marginTop
     * @param marginLeft
     */
    public constructor(pathToFont: string, paperSize: PaperSize, marginTop: number, marginLeft: number) {
        this.pathToFont = pathToFont;
        this.pdfkit = new PDFKit({font: pathToFont, size: paperSize});
        this.pdfkit.translate(MillimeterValue.from(marginLeft).toPoint(), MillimeterValue.from(marginTop).toPoint());
    }

    private readonly pdfkit: PDFKit.PDFDocument;

    /**
     * 描画色。
     */
    public color: string = "#000";

    /**
     * フォントへのパス。
     */
    public pathToFont: string;

    /**
     * フォントサイズ。
     */
    public fontSize: number = 12;

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
     * 指定文字列を描画するレイアウトを作成する。
     * 
     * @param text
     * @param maximumWidth 最大幅。
     * @param maximumHeight 最大高さ。
     * @returns 
     */
    private createLayout(text: string, maximumWidth?: number, maximumHeight?: number): Layout {
        this.pdfkit.font(this.pathToFont, this.fontSize);
        let fontSize = this.fontSize;
        let lines: string[] = [];
        let layout: Layout | undefined;
        while (typeof layout === "undefined") {
            let line = new StringObject();
            for (let index = 0; index < text.length; index++) {
                const one = new StringObject(text).extract(index, index + 1);
                const width = MillimeterValue.fromPoint(this.pdfkit.widthOfString(line.clone().append(one).toString(), {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE})).value;
                if (this.allowAutomaticLineFeed && typeof maximumWidth !== "undefined" && maximumWidth < width || one.equals("\n")) {
                    if (line.length() > 0) {
                        lines.push(line.toString());
                    }
                    line = one.replaceLF("");
                } else {
                    line.append(one);
                }
            }
            lines.push(line.toString());
            let width = 0;
            let height = 0;
            for (const line of lines) {
                const lineWidth = MillimeterValue.fromPoint(this.pdfkit.widthOfString(line, {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE})).value;
                if (width < lineWidth) {
                    width = lineWidth;
                }
                if (height > 0 && this.leading) {
                    height += this.leading;
                }
                height += MillimeterValue.fromPoint(this.pdfkit.heightOfString(line, {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE})).value;
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
                layout = {lines: lines, fontSize: fontSize, width: width, height: height};
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
    public measureTextSize(text: string, maximumWidth?: number, maximumHeight?: number): Dimension {
        let width = 0;
        let height = 0;
        const layout = this.createLayout(text, maximumWidth, maximumHeight);
        if (typeof layout !== "undefined") {
            width = layout.width;
            height = layout.height;
        }
        return {width: width, height: height};
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
    private printOneLine(oneLine: string, x: number, y: number, maximumWidth?: number): Dimension {
        const lineWidth = MillimeterValue.fromPoint(this.pdfkit.widthOfString(oneLine, {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE})).value;
        const lineHeight = MillimeterValue.fromPoint(this.pdfkit.heightOfString(oneLine, {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE})).value;
        let filledX: number = x;
        switch (this.textHorizontalPosition) {
        case "left":
            this.pdfkit.text(oneLine, MillimeterValue.from(filledX).toPoint(), MillimeterValue.from(y).toPoint(), {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE});
            break;
        case "center":
            if (maximumWidth) {
                filledX += maximumWidth / 2;
            }
            filledX -= lineWidth / 2;
            this.pdfkit.text(oneLine, MillimeterValue.from(filledX).toPoint(), MillimeterValue.from(y).toPoint(), {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE});
            break;
        case "right":
            if (maximumWidth) {
                filledX += maximumWidth;
            }
            filledX -= lineWidth;
            this.pdfkit.text(oneLine, MillimeterValue.from(filledX).toPoint(), MillimeterValue.from(y).toPoint(), {lineBreak: false, width: Number.MAX_VALUE, height: Number.MAX_VALUE});
            break;
        }
        let leading = this.leading;
        if (typeof leading === "undefined") {
            leading = 0;
        }
        return {width: lineWidth, height: lineHeight + leading};
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
        this.pdfkit.fillColor(this.color);
        const layout = this.createLayout(text, maximumWidth, maximumHeight);
        if (typeof this.lastAdjustedFontSize !== "undefined") {
            this.pdfkit.font(this.pathToFont, this.lastAdjustedFontSize);
        } else {
            this.pdfkit.font(this.pathToFont, this.fontSize);
        }
        let printingY: number = y;
        switch (this.textVerticalPosition) {
            case "top":
                for (const line of layout.lines) {
                    const dimension = this.printOneLine(line, x, printingY);
                    printingY += dimension.height;
                }
                break;
            case "middle":
                printingY -= layout.height / 2;
                for (const line of layout.lines) {
                    const dimension = this.printOneLine(line, x, printingY);
                    printingY += dimension.height;
                }
                break;
            case "bottom":
                printingY -= layout.height;
                for (const line of layout.lines) {
                    const dimension = this.printOneLine(line, x, printingY);
                    printingY += dimension.height;
                }
                break;                        
        }
        return {width: layout.width, height: layout.height};
    }

    /**
     * 指定されたBoundsの中にテキストを描画する。この処理で自動調整されたフォントサイズはインスタンス内で保持される。
     * 
     * @param text
     * @param bounds
     * @returns 描画したテキストのサイズ。
     */
    public printTextInBox(text: string, bounds: Bounds): Dimension {
        this.pdfkit.fillColor(this.color);
        const layout = this.createLayout(text, bounds.width, bounds.height);
        if (typeof this.lastAdjustedFontSize !== "undefined") {
            this.pdfkit.font(this.pathToFont, this.lastAdjustedFontSize);
        } else {
            this.pdfkit.font(this.pathToFont, this.fontSize);
        }
        let printingY: number = bounds.y;
        switch (this.textVerticalPosition) {
            case "top":
                for (const line of layout.lines) {
                    const dimension = this.printOneLine(line, bounds.x, printingY, bounds.width);
                    printingY += dimension.height;
                }
                break;
            case "middle":
                printingY += bounds.height / 2;
                printingY -= layout.height / 2;
                for (const line of layout.lines) {
                    const dimension = this.printOneLine(line, bounds.x, printingY, bounds.width);
                    printingY += dimension.height;
                }
                break;
            case "bottom":
                printingY += bounds.height;
                printingY -= layout.height;
                for (const line of layout.lines) {
                    const dimension = this.printOneLine(line, bounds.x, printingY, bounds.width);
                    printingY += dimension.height;
                }
                break;                        
        }
        return {width: layout.width, height: layout.height};
    }

    /**
     * 線の太さ。
     */
    public lineWidth: number = 1;

    /**
     * 破線。
     */
    public lineDash: {dash: number, space: number} | undefined = undefined;

    /**
     * 指定位置に線を描画する。
     * 
     * @param startX 
     * @param startY 
     * @param endX 
     * @param endY 
     */
    public printLine(startX: number, startY: number, endX: number, endY: number) {
        this.pdfkit.strokeColor(this.color);
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        } else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), {space: MillimeterValue.from(this.lineDash.space).toPoint()});
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
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        } else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), {space: MillimeterValue.from(this.lineDash.space).toPoint()});
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
    public printRectangleLine(x: number, y: number, width: number, height: number, radius: number = 0) {
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
    public printRectangleFill(x: number, y: number, width: number, height: number, radius: number = 0) {
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
    private createEllipsePath(x: number, y: number, width: number, height: number) {
        this.pdfkit.lineWidth(MillimeterValue.from(this.lineWidth).toPoint());
        if (typeof this.lineDash === "undefined") {
            this.pdfkit.undash();
        } else {
            this.pdfkit.dash(MillimeterValue.from(this.lineDash.dash).toPoint(), {space: MillimeterValue.from(this.lineDash.space).toPoint()});
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
    public printEllipseLine(x: number, y: number, width: number, height: number) {
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
    public printEllipseFill(x: number, y: number, width: number, height: number) {
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
        this.pdfkit.fillColor(this.color);
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
        this.pdfkit.fillColor(this.color);
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
