//more accurate sentence grabber, accounts for abbreviations (customizable)
export class SentenceGrabber {
     
    //list of common abbreviations: can be extended by calling SentenceGrabber.extendAbbreviations("<your abbreviation>")
    static Abbreviations = [...Object.keys({
        'a.m': true,
        'p.m': true,
        etc: true,
        vol: true,
        inc: true,
        jr: true,
        dr: true,
        tex: true,
        co: true,
        prof: true,
        rev: true,
        revd: true,
        hon: true,
        'v.s': true,
        ie: true,
        eg: true,
        'et al': true,
        st: true,
        'ph.d': true,
        capt: true,
        mr: true,
        mrs: true,
        ms: true,
        'e.o.d.': true,
        jan: true,
        feb: true,
        mar: true,
        apr: true,
        jun: true,
        jul: true,
        aug: true,
        sept: true,
        nov: true,
        dec: true,
        'sun.': true,
        'mon.': true,
        'tue.': true,
        thur: true,
        fri: true,
        'sat.': true,
    })]
    static Dividers = [ ".", "!","?"]
    // static Dividers = {
    //     ".": true,
    //     "?": true,
    //     "!": true,
    // }
    
    /**
     * @param {string} newAbbreviation an abbreviation to be recognized by the sentence grabber, automatically lowercased 
     */
    static extendAbbreviations(newAbbreviation){
        const key = newAbbreviation.toLowerCase().trim()
        SentenceGrabber.Abbreviations[key] = true; 
    } 

    static _isAbbreviation(text){
        const low = text.toLowerCase()
        const a = SentenceGrabber.Abbreviations.includes(low)
        const b = SentenceGrabber.Abbreviations.includes(low.substring(0,text.length-1))

        if(a || b) return true
        if(text.endsWith("."))text = text.substring(0,text.length-1)
        text = text.split(".")
        return text.length > 1 && text.filter(x=>x.length <= 2).length > 0
    }

    static grabSentences(text){
        const sentences = [] 
        let pos = 0; 
        for(let i = 0; i < text.length; i++){
            const end = Math.min(text.length-1,i+1)
            let $ = text.slice(pos,end).split(" ");
            const isPunctuation= SentenceGrabber.Dividers.includes(text[i])
            const checkNext = ( text[i+1]==" " || text[i+1]=='"' || text[i+1] == "[" || i >= text.length-1 )
            const lastIsAbbreviation = SentenceGrabber._isAbbreviation($.at(-1))

            if(isPunctuation && checkNext && !lastIsAbbreviation ){
                const sliceEnd = Math.min(text.length, i+1)
                sentences.push(text.slice(pos,sliceEnd).trim())
                pos = i+1;
            }
        }
        
        return sentences;
    }


}

/**
 * @about uses the "4 chars per token" heuristic
 * @param {string} txt any text
 * @returns {Number} an ESTIMATED number of openai tokens present in the given text
 */
const estTokens = txt => Math.ceil(0.25*txt.length)

/**
 * 
 * @param {string[]} sentences an array of sentences
 * @param {number} maxWindowTokens the number of tokens per resulting 'window' 
 * @param {number} sentenceOverlap how many (left) sentences should overlap in each window (after the first)? 
 * @returns 
 */
export function windowSentences(sentences, maxWindowTokens,sentenceOverlap=2){
    const windows = []
    let window = "" , i = 0, currTokens = 0;
    while(i < sentences.length){
        const newTokens = estTokens(sentences[i])
        if(currTokens + newTokens > maxWindowTokens){
           // windows.push({text:window,citation: config.citation || DEFAULT_CITE()});
            windows.push(window)
			window = "", currTokens = 0;
            if(i-sentenceOverlap > 0) i -= sentenceOverlap
        } else { 
            currTokens += newTokens;
            window += sentences[i]
            i++;
        }
    }
	if(window.length > 0) windows.push(window)
    return windows

}

//OLD sentence tokenizer -> doesn't account for abbreviations, slightly faster than new version, so may prove useful...
export function getSentences(text){
    let words = text.split(" ")
    const sentences = [] 
    let sentence = "" , w = 0
    while(w < words.length){
        const endChar = words[w].at(-1)
        if(endChar === "." || endChar === "?" || endChar === "!" || endChar === ""){
            sentences.push(sentence + words[w])
            sentence = ""
        } else { 
            sentence += words[w] + " "
        }
        w++
    }
    if(sentence.length>0){
        sentences.push(sentence + ".")
    }
    return sentences
}