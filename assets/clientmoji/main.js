const COMIC_WIDTH = 398
const COMIC_HEIGHT = 398
const BINDING_BOX_BUFFER = 5
const ULTIMATE_EFFECT_SVG_ID = 164

let config = null

const updateWhenReady = (doc, callback) => {

    if (doc.readyState !== 'loading' && doc.getElementById('effectSvgTransform')) {
        return callback()
    }
    return doc.addEventListener('DOMContentLoaded', callback)
}

const updateText = (text) => {
    const line1Selectors = [
        '#mask1034 textPath',
        '#mask1122 textPath',
        '#mask1221 textPath',
        '#mask1428 textPath',
        '#g2809 textPath'
    ]

    const line4Selectors = [
        '#mask1325 tspan',
        '#mask1104 tspan',
        '#mask1309 tspan',
        '#mask1335 tspan',
        '#g2215 tspan'
    ]

    const svgEffectDOMNode = document.getElementById('effectSvgTransform')

    let effectSelectors = line1Selectors
    // Check if the line 1 of ultimate is populated, if so, update it with preview text
    // otherwise update line 4
    if (!svgEffectDOMNode.querySelector(line1Selectors[0])) {
        effectSelectors = line4Selectors
    }

    // TODO
    // need to have some logic here to block a config from being applied if its over the max char limit
    svgEffectDOMNode.querySelectorAll(effectSelectors)
        .forEach((node) => {
            node.textContent = text
        })

    showEffect()
    const textPaths = svgEffectDOMNode.querySelectorAll(effectSelectors)
    let bindingBox = document.getElementById('bindingbox')
    const applicableFontSize = adjustFontSize(textPaths, bindingBox)
    return applyConfig(applicableFontSize)
}

const updateMultilineText = (line1, line2) => {

    // find iframe for comic and update text in paths
    // Hardcoding these for now as they are the ultimate effect line 1 and line 4 text selectors
    const line1Selectors = [
        '#mask1034 textPath',
        '#mask1122 textPath',
        '#mask1221 textPath',
        '#mask1428 textPath',
        '#g2809 textPath'
    ]

    const line2Selectors = [
        '#mask1125 textPath',
        '#mask1044 textPath',
        '#mask1138 textPath',
        '#mask1255 textPath',
        '#g2611 textPath'
    ]

    // NOTE: To be used for 2+ lines of text
    // const line3Selectors = [
    //   '#mask1300 tspan',
    //   '#mask1053 tspan',
    //   '#mask1194 tspan',
    //   '#mask1268 tspan',
    //   '#g2413 tspan'
    // ]

    const line4Selectors = [
        '#mask1325 tspan',
        '#mask1104 tspan',
        '#mask1309 tspan',
        '#mask1335 tspan',
        '#g2215 tspan'
    ]

    const line5Selectors = [
        '#mask1019 tspan',
        '#mask1096 tspan',
        '#mask1427 tspan',
        '#mask1435 tspan',
        '#g2017 tspan'
    ]

    // NOTE: To be used for 2+ lines of text
    // const line6Selectors = [
    //   '#mask1051 tspan',
    //   '#mask1088 tspan',
    //   '#mask1472 tspan',
    //   '#mask1478 tspan',
    //   '#layer1 tspan'
    // ]


    const svgEffectDOMNode = document.getElementById('effectSvgTransform')

    let effectSelectors = line1Selectors
    // Check if the line 1 of ultimate is populated, if so, update it with preview text
    // otherwise update line 4
    if (!svgEffectDOMNode.querySelector(line1Selectors[0])) {
        effectSelectors = line4Selectors
    }

    let line2EffectSelectors = line2Selectors
    // set text line 2 selectors to line 5 of the effect if needbe
    if (effectSelectors[0] === line4Selectors[0]) {
        line2EffectSelectors = line5Selectors
    }

    const textFields = {
        line1 : line1,
        line2 : line2 ? line2 : ''
    }

    svgEffectDOMNode.querySelectorAll(effectSelectors)
        .forEach((node) => {
            node.textContent = textFields.line1
        })

    svgEffectDOMNode.querySelectorAll(line2EffectSelectors)
        .forEach((node) => {
            node.textContent = textFields.line2
        })

    const bindingBox = document.getElementById('bindingbox')
    const line1textPaths = svgEffectDOMNode.querySelectorAll(effectSelectors)
    const line2textPaths = svgEffectDOMNode.querySelectorAll(line2EffectSelectors)
    adjustFontSizeForTwoLines(line1textPaths, line2textPaths, bindingBox)
    showEffect()
}

/**
 * Function to properly split the inputting text for multiline comics
 * @param  {String} text Text inputted to be put on the comic
 * @return {Object} {line1: String, line2: String}
 */
const splitText = (text) => {

    // If text doesn't include a space, don't split it
    if (!text.includes(' ')) {
        return {
            line1: text,
            line2: ''
        }
    }

    // TODO:
    // Need to set some max on first line char length
    const halfway = Math.floor(text.length / 2)
    let splitIndex = halfway

    if (text[halfway] !== ' ') {
        const firstTry = text.indexOf(' ')
        const secondTry = text.lastIndexOf(' ', halfway + 1)

        splitIndex = secondTry !== -1 ? secondTry : firstTry
    }

    const line1 = text.substring(0, splitIndex)
    const line2 = text.substring(splitIndex + 1)

    return {
        line1,
        line2
    }
}

/**
 * Check if the text path is out of bounds.
 * Check if at least one edge is outside of the binding box limits.
 * Use a buffer on all edges to compensate for the stroke/glowing effects that may be used
 * and don't want to cut off.
 *
 * @param  {HTMLElement}   textPath       Text path to check
 * @param  {HTMLElement}   bindingBox     Box that the text path should fit in
 * @return {Boolean}       isOutOfBounds  Flag if text path is out of bounds or not
 */
const isOutOfBounds = (textPath, bindingBox) => {

    if (bindingBox.getBBox().width === COMIC_WIDTH && bindingBox.getBBox().height === COMIC_HEIGHT) {
        return (textPath.getBoundingClientRect().left <= bindingBox.getBoundingClientRect().left + BINDING_BOX_BUFFER ||
            textPath.getBoundingClientRect().right >= bindingBox.getBoundingClientRect().right - BINDING_BOX_BUFFER ||
            textPath.getBoundingClientRect().top <= bindingBox.getBoundingClientRect().top + BINDING_BOX_BUFFER ||
            textPath.getBoundingClientRect().bottom >= bindingBox.getBoundingClientRect().bottom - BINDING_BOX_BUFFER)
    }

    const outsideLR = (textPath.getBoundingClientRect().left <= bindingBox.getBoundingClientRect().left ||
        textPath.getBoundingClientRect().right >= bindingBox.getBoundingClientRect().right)
    const aboveTop = textPath.getBoundingClientRect().top <= bindingBox.getBoundingClientRect().top
    const belowBottom = textPath.getBoundingClientRect().bottom >= bindingBox.getBoundingClientRect().bottom

    return outsideLR || (aboveTop && belowBottom)
}

/**
 * Check if the text path is within the binding box bounds.
 * Ensure all edges are within the binding box.
 * Use a buffer on all edges to compensate for the stroke/glowing effects that may be used
 * and don't want to cut off.
 *
 * @param  {HTMLElement}   textPath       Text path to check
 * @param  {HTMLElement}   bindingBox     Box that the text path should fit in
 * @return {Boolean}       isUnderBounds  Flag if text path is inside bounds or not
 */
const isUnderBounds = (textPath, bindingBox) => {

    if (bindingBox.getBBox().width === COMIC_WIDTH && bindingBox.getBBox().height === COMIC_HEIGHT) {
        return (textPath.getBoundingClientRect().left >= bindingBox.getBoundingClientRect().left + BINDING_BOX_BUFFER &&
            textPath.getBoundingClientRect().right <= bindingBox.getBoundingClientRect().right - BINDING_BOX_BUFFER &&
            textPath.getBoundingClientRect().top >= bindingBox.getBoundingClientRect().top + BINDING_BOX_BUFFER &&
            textPath.getBoundingClientRect().bottom <= bindingBox.getBoundingClientRect().bottom - BINDING_BOX_BUFFER)
    }

    const withinLR = (textPath.getBoundingClientRect().left >= bindingBox.getBoundingClientRect().left &&
        textPath.getBoundingClientRect().right <= bindingBox.getBoundingClientRect().right)

    const underTop = textPath.getBoundingClientRect().top >= bindingBox.getBoundingClientRect().top
    // const aboveBottom = textPath.getBoundingClientRect().bottom <= bindingBox.getBoundingClientRect().bottom

    return withinLR && underTop
}

/**
 * Shrink text path as much as possible to fit within the box.
 *
 * @param  {HTMLElement}   textPath       Text path to shrink
 * @param  {HTMLElement}   bindingBox     Box that the text path should fit within
 * @param  {Number}        minTextSize=5  Minimum text font size
 * @return {Number}        fontSize       New font size that fits within the binding box
 */
const decreaseAndReturnNewFontSize = (textPath, bindingBox, minTextSize = 5) => {

    let fontSize = getTextPathFontSize(textPath)

    while (isOutOfBounds(textPath, bindingBox) && fontSize >= minTextSize) {
        fontSize = fontSize - 0.5
        setTextPathFontSize(textPath, fontSize)
    }

    return fontSize
}

/**
 * Enlarge text path as much as possible to fit within the box.
 *
 * @param  {HTMLElement}   textPath       Text path to enlarge
 * @param  {HTMLElement}   bindingBox     Box that the text path should fit within
 * @param  {Number}        maxTextSize=5  Maximum text font size
 * @return {Number}        fontSize       New font size that fits within the binding box
 */
const increaseAndReturnNewFontSize = (textPath, bindingBox, maxTextSize = 80) => {

    let fontSize = getTextPathFontSize(textPath)

    while (isUnderBounds(textPath, bindingBox) && fontSize <= maxTextSize) {
        fontSize = fontSize + 0.5
        setTextPathFontSize(textPath, fontSize)
    }
    return fontSize
}

/**
 * Loop through all of the text paths and update the font size.
 *
 * @param  {[HTMLElement]} textPaths   Array of text paths to update
 * @param  {Number}        fontSize    Font size to update to
 */
const updateTextPathsFontSize = (textPaths, fontSize) => {

    // Loop through the remaining text paths and set the current font size to match the first one
    for (let i = 1; i < textPaths.length; ++i) {
        setTextPathFontSize(textPaths[i], fontSize)
    }
}

/**
 * Set a given text path's parent font size style attribute.
 * Also update the text path font size if that style attribute is set.
 *
 * @param  {HTMLElement} textPath  Text path to update
 * @param  {Number}      fontSize  Font size to update to
 */
const setTextPathFontSize = (textPath, fontSize) => {

    textPath.parentElement.style.fontSize = `${fontSize}px`
    // If the text path itself has a font size we need to update that one too
    if (textPath.style.fontSize || textPath.getAttribute('font-size')) {
        textPath.style.fontSize = `${fontSize}px`
    }
}

/**
 * Extract the font size of the text path from the CSS style object.
 * Most of the time the parent element has the font size but there are also
 * cases where only the child does so check accordingly.
 *
 * @param  {HTMLElement} textPath   Text path to extract the font size from
 * @return {Number}      fontSize   Text path font size from the CSS style object
 */
const getTextPathFontSize = (textPath) => {

    let fontSize = +textPath.parentElement.style.fontSize.split('px')[0] || +textPath.parentElement.getAttribute('font-size')
    // Sometimes there may be a text path where the parent doesn't have a font size
    // and only the child does
    if (!fontSize) {
        fontSize = +textPath.style.fontSize.split('px')[0] || +textPath.style.fontSize.getAttribute('font-size')
    }
    return fontSize
}

const adjustFontSize = (textPaths, bindingBox) => {

    // Use the first text path of the line to perform checks and dictate thep
    // font size of the text
    const firstTextPath = textPaths[0]

    // Check if there is text in the line by checking the first text path contents
    if (!firstTextPath) {
        return
    }

    let currentFontSize = getTextPathFontSize(firstTextPath)
    // If the first text path is out of bounds, decrease the font size until it fits
    if (isOutOfBounds(firstTextPath, bindingBox)) {
        // Get the new font size after shrinking the first text path to fit in the box
        currentFontSize = decreaseAndReturnNewFontSize(firstTextPath, bindingBox)
    } else if (isUnderBounds(firstTextPath, bindingBox)) {
        // Get the new font size after expanding the first text path to fit in the box
        currentFontSize = increaseAndReturnNewFontSize(firstTextPath, bindingBox)
    }

    // Don't try to update the text path font size if the currentFontSize isn't set
    if (!currentFontSize) {
        return
    }

    // Update the other text paths to the new font size
    updateTextPathsFontSize(textPaths, currentFontSize)
    return currentFontSize
}

const adjustFontSizeForTwoLines = (line1TextPaths, line2TextPaths, bindingBox) => {

    // Adjust the font size for the first line
    adjustFontSize(line1TextPaths, bindingBox)

    // Get the first line's font size to be the upper bound of line 2's font size
    const line1FontSize = getTextPathFontSize(line1TextPaths[0])

    let line2TextSize = null
    if (isOutOfBounds(line2TextPaths[0], bindingBox)) {
        // Get the new font size after shrinking the first text path to fit in the box
        line2TextSize = decreaseAndReturnNewFontSize(line2TextPaths[0], bindingBox)
    } else if (isUnderBounds(line2TextPaths[0], bindingBox)) {
        // Get the new font size after expanding the first text path to fit in the box
        line2TextSize = increaseAndReturnNewFontSize(line2TextPaths[0], bindingBox, line1FontSize)
    }

    // Don't try to update the text path font size if the line2TextSize isn't set
    if (!line2TextSize) {
        return
    }

    // Update the other text paths to the new font size
    updateTextPathsFontSize(line2TextPaths, line2TextSize)
}

const applyBaseXY = (x, y) => {
    const svgElement = document.getElementById('effectSvgTransform').children[0]
    svgElement.setAttribute('x', x)
    svgElement.setAttribute('y', y)
}

const applyConfig = (fontSize) => {

    if (!config) {
        const configJson = document.getElementById('configJson').innerHTML
        if (configJson != null && configJson != '') {
            config = JSON.parse(configJson)
        }
    }

    if (!config || !config.length) {
        console.log("configs still empty")
        return false
    }

    let applicableConfig = config.find(config => {
        return fontSize >= config.min_font && fontSize <= config.max_font
    })

    if (!applicableConfig) {
        // Use the closest config when the font size is out of bounds
        // This is to support the character limit heuristic when the
        // user types for ex all W and the font goes below the allowed
        // font size

        var maxConfig = null
        var minConfig = null

        for (currConfig in config) {
            if (!maxConfig || currConfig.max_font > maxConfig.max_font) {
                maxConfig = currConfig
            }

            if (!minConfig || currConfig.min_font < minConfig.min_font) {
                minConfig = currConfig
            }
        }

        if (fontSize < minConfig.min_font) {
            applicableConfig = minConfig
        } else {
            applicableConfig = maxConfig
        }
    }
    
    if (!applicableConfig.baseSvgDefaults) {
        console.log("applicableConfig.baseSvgDefaults is null")
        return false
    }

    const svgEffectDOMElement = document.getElementById('effectSvgTransform')
    const svgElement = svgEffectDOMElement.children[0]

    const dimensionX = COMIC_WIDTH * parseFloat(applicableConfig.baseSvgDefaults.scaleFactor || 1.0)
    const dimensionY = COMIC_HEIGHT * parseFloat(applicableConfig.baseSvgDefaults.scaleFactor || 1.0)
    const x = parseInt(applicableConfig.baseSvgDefaults.xOffset || 0)
    const y = parseInt(applicableConfig.baseSvgDefaults.yOffset || 0)

    svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet')
    svgElement.setAttribute('width', dimensionX)
    svgElement.setAttribute('height', dimensionY)
    svgElement.setAttribute('x', x)
    svgElement.setAttribute('y', y)

    svgEffectDOMElement.setAttribute('transform', `rotate(${applicableConfig.baseSvgDefaults.rotation}, ${x + (dimensionX / 2)}, ${y + (dimensionY / 2)})`)
    return true
}

/**
 * Remove any opacity attribute on the SVG effect element to ensure it is shown
 */
const showEffect = () => {
    const svgEffectDOMNode = document.getElementById('effectSvgTransform')
    if (svgEffectDOMNode.getAttribute('opacity')) {
        svgEffectDOMNode.removeAttribute('opacity')
    }
}
