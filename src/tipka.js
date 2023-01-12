class Positioner {
    /** Metoda zwraca odległość koordynatów elementu od koordynatów (0, 0) okna */
    getBoundingClientRectExtended(elem) {
        const rect = elem.getBoundingClientRect();
        const vCenter = rect.top + 0.5 * rect.height;
        const hCenter = rect.left + 0.5 * rect.width;
        return Object.assign(rect, { vCenter, hCenter });
    }

    /** znajdź najlepsze dopasowanie elementu na ekranie */
    findBestFit(triggerCoords, tooltip, offset, windowOffset, recommendedFits) {
        const tooltipRect = tooltip.getBoundingClientRect();
        let widthRadioForTopBottom = window.innerWidth / (tooltipRect.width + windowOffset + windowOffset);
        if (widthRadioForTopBottom > 1) {
            widthRadioForTopBottom = 1;
        }
        let heightRatioForTop = triggerCoords.top / (tooltipRect.height + offset + windowOffset);
        if (heightRatioForTop > 1) {
            heightRatioForTop = 1;
        }
        let heightRatioForBottom = (window.innerHeight - triggerCoords.bottom) / (tooltipRect.height + offset + windowOffset);
        if (heightRatioForBottom > 1) {
            heightRatioForBottom = 1;
        }
        let heightRatioForLeftRight = window.innerHeight / (tooltipRect.height + windowOffset + windowOffset);
        if (heightRatioForLeftRight > 1) {
            heightRatioForLeftRight = 1;
        }
        let widthRatioForLeft = triggerCoords.left / (tooltipRect.width + offset + windowOffset);
        if (widthRatioForLeft > 1) {
            widthRatioForLeft = 1;
        }
        let widthRatioForRight = (window.innerWidth - triggerCoords.right) / (tooltipRect.width + offset + windowOffset);
        if (widthRatioForRight > 1) {
            widthRatioForRight = 1;
        }

        let ratios = [];
        for (let i = 0; i < recommendedFits.length; i++) {
            let fitCode = recommendedFits[i];
            if (fitCode === 't') {
                if (widthRadioForTopBottom === 1 && heightRatioForTop === 1) {
                    return fitCode;
                } else {
                    ratios.push({ 'fitCode': fitCode, 'ratio': widthRadioForTopBottom + heightRatioForTop })
                }
            } else if (fitCode === 'b') {
                if (widthRadioForTopBottom === 1 && heightRatioForBottom === 1) {
                    return fitCode;
                } else {
                    ratios.push({ 'fitCode': fitCode, 'ratio': widthRadioForTopBottom + heightRatioForBottom })
                }
            } else if (fitCode === 'l') {
                if (heightRatioForLeftRight === 1 && widthRatioForLeft === 1) {
                    return fitCode;
                } else {
                    ratios.push({ 'fitCode': fitCode, 'ratio': heightRatioForLeftRight + widthRatioForLeft })
                }
            } else if (fitCode === 'r') {
                if (heightRatioForLeftRight === 1 && widthRatioForRight === 1) {
                    return fitCode;
                } else {
                    ratios.push({ 'fitCode': fitCode, 'ratio': heightRatioForLeftRight + widthRatioForRight })
                }
            }
        }
        ratios.sort(function (a, b) {
            return b.ratio - a.ratio;
        });
        return ratios[0].fitCode;
    }

    /** Jeśli tooltip jest na górze/dole określ najlepsze położenie w poziomie */
    calcTopBottomHorizontalPos(triggerCoords, tooltip, windowOffset) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const tooltipInitialLeft = triggerCoords.hCenter - 0.5 * tooltipRect.width;
        const leftSpace = triggerCoords.hCenter - windowOffset - 0.5 * tooltipRect.width;
        const rightSpace = window.innerWidth - triggerCoords.hCenter - windowOffset - 0.5 * tooltipRect.width;
        if (leftSpace >= 0 && rightSpace >= 0) {
            return tooltipInitialLeft;
        }
        return leftSpace < 0
            ? tooltipInitialLeft - leftSpace
            : tooltipInitialLeft + rightSpace;
    }

    /** Jeśli tooltip jest na lewo/prawo określ nalepsze położenie w pionie */
    calcLeftRightVerticalPos(triggerCoords, tooltip, windowOffset) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const tooltipInitialTop = triggerCoords.vCenter - 0.5 * tooltipRect.height;
        const topSpace = triggerCoords.vCenter - windowOffset - 0.5 * tooltipRect.height;
        const bottomSpace = window.innerHeight - triggerCoords.vCenter - windowOffset - 0.5 * tooltipRect.height;
        if (topSpace >= 0 && bottomSpace >= 0) {
            return tooltipInitialTop;
        }
        return topSpace < 0
            ? tooltipInitialTop - topSpace
            : tooltipInitialTop + bottomSpace;
    }

    /** Zwraca obiekt z ostatecznymi koordynatami tooltipa */
    getXY(triggerCoords, tooltip, offset, windowOffset, bestFitCode) {
        const tooltipRect = tooltip.getBoundingClientRect();

        if (bestFitCode === 't') {
            return {
                'x': window.scrollX + this.calcTopBottomHorizontalPos(triggerCoords, tooltip, windowOffset),
                'y': window.scrollY + triggerCoords.top - offset - tooltipRect.height
            }
        } else if (bestFitCode === 'b') {
            return {
                'x': window.scrollX + this.calcTopBottomHorizontalPos(triggerCoords, tooltip, windowOffset),
                'y': window.scrollY + triggerCoords.bottom + offset
            }
        } else if (bestFitCode === 'l') {
            return {
                'x': window.scrollX + triggerCoords.left - offset - tooltipRect.width,
                'y': window.scrollY + this.calcLeftRightVerticalPos(triggerCoords, tooltip, windowOffset)
            }
        } else if (bestFitCode === 'r') {
            return {
                'x': window.scrollX + triggerCoords.right + offset,
                'y': window.scrollY + this.calcLeftRightVerticalPos(triggerCoords, tooltip, windowOffset)
            }
        }
    }

    getTooltipParameters(hookElement, tooltipElement, options) {
        const hookElementCoords = this.getBoundingClientRectExtended(hookElement);
        const tooltipElementCoords = this.getBoundingClientRectExtended(tooltipElement)
        const opts = Object.assign(
            {
                'fits': ['t', 'r', 'b', 'l'],
                'offset': 20,
                'windowOffset': 5
            }
            , options ?? {}
        );
        const bestFit = this.findBestFit(hookElementCoords, tooltipElement, opts.offset, opts.windowOffset, opts.fits);

        return Object.assign(
            this.getXY(hookElementCoords, tooltipElement, opts.offset, opts.windowOffset, bestFit),
            { bestFit }
        );
    }
}

class Tipka {
    constructor() {
        this.div = null;
        this.id = (new Date()).getTime() + '' + Math.round(Math.random() * 10000);
        this.rollOutTimeoutId = null;
    }

    init() {
        if (!document.getElementById(this.id)) {
            let div = document.createElement('div');
            div.id = this.id
            div.style.position = 'absolute';
            div.style.zIndex = 10000;
            div.style.width = '400px';
            div.style.height = '300px';
            div.style.border = '1px solid #bbb';
            div.style.background = '#fff';
            div.style.borderRadius = '5px'
            div.style.boxShadow = "#888 0px 0px 4px 0";
            div.style.padding = "6px";
            div.style.left = '-100000px';
            div.style.top = '-100000px';
            div.style.opacity = 0;

            div.addEventListener('mouseenter', (e) => {
                clearTimeout(this.rollOutTimeoutId);
            })

            div.addEventListener('mouseleave', (e) => {
                this.delayedClose();
            })

            document.querySelector('body').appendChild(div);

            this.div = div;
        }

        return this;
    }

    open(x, y, text) {
        clearTimeout(this.rollOutTimeoutId);

        const div = this.init().getDiv();

        div.innerHTML = 'abcd'

        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.opacity = 1;

        return this;
    }

    close() {
        const div = this.init().getDiv();

        div.style.left = '-100000px';
        div.style.top = '-100000px';
        div.style.opacity = 0;

        return this;
    }

    delayedClose() {
        this.rollOutTimeoutId = setTimeout(this.close.bind(this), 100)
    }

    destroy() {

    }

    getDiv() {
        return this.init().div;
    }
}






var tipex = new Tipka();
var pos = new Positioner();
document.getElementById('test').addEventListener('mouseover', (e) => {


    var xy = pos.getTooltipParameters(
        document.getElementById('test'),
        tipex.getDiv(),
        {
            'fits': ['l', 'r', 't', 'r', 'b', 'l']
        }
    );
console.log(xy)
    tipex.open(xy.x, xy.y);
})

document.getElementById('test').addEventListener('mouseout', (e) => {
   tipex.delayedClose();
})