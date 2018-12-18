const {uniq, cloneDeep} = require('lodash')

// [Link], #HashTag
// Not supported:
//  - Icons
//  - External links
//  - External project links

let Flags = {}
const initFlags = () => {
  Flags = {
    codeBlock: false,
    inlineCode: false,
    shellLine: false,
    seekingMarkClose: null
  }
}

let dicts = []
const initParser = () => {
  dicts = []
}

const Marks = {
  doubleBracketOpen: '[[',
  doubleBracketClose: ']]',
  singleBracketOpen: '[',
  singleBracketClose: ']',
  backQuote: '`'
}

const exstractScrapboxSyntax = (fullStr, start, depth, seekEndMark) => {
  fullStr = fullStr.trim()
  const startIdxKeep = start
  const l = fullStr.length
  while (start < l) {
    const subStr = fullStr.substring(start, l)
    Flags.seekingMarkClose = null
    let parsedSyntax, token

    if (!Flags.inlineCode) {
      if (subStr.startsWith(Marks.doubleBracketOpen)) {
        // [[...]]
        const mark = Marks.doubleBracketClose
        token = exstractScrapboxSyntax(fullStr, start + mark.length, depth + 1, mark)
        const word = fullStr.substring(token[0], token[1])
        parsedSyntax = { type: 'bold', word }
        Flags.seekingMarkClose = mark
      } else if (subStr.startsWith(Marks.singleBracketOpen)) {
        // [...]
        const mark = Marks.singleBracketClose
        token = exstractScrapboxSyntax(fullStr, start + mark.length, depth + 1, mark)
        const word = fullStr.substring(token[0], token[1])
        parsedSyntax = { type: 'singleBracket', word }
        Flags.seekingMarkClose = mark
      } else if (subStr.startsWith((Marks.backQuote))) {
        // `...`
        const mark = Marks.backQuote
        Flags.inlineCode = true
        token = exstractScrapboxSyntax(fullStr, start + mark.length, depth + 1, mark)
        const word = fullStr.substring(token[0], token[1])
        parsedSyntax = { type: 'inlineCode', word }
        Flags.seekingMarkClose = mark
      }
    }

    if (Flags.seekingMarkClose !== null) {
      dicts.push(parsedSyntax)
      start = token[1]
    }

    // 探していた閉じマークが見つかった
    if (subStr.startsWith(seekEndMark)) {
      if (seekEndMark === Marks.backQuote) Flags.inlineCode = false
      return [startIdxKeep, start]
    }

    start += 1
  }
  return [startIdxKeep, start]
}

const extractHashTags = row => {
  row = ' ' + row + ' ';
  const res = []
  const hashTags = row.match(/(^| )\#[^ ]+/gi);
  if (hashTags) {
    for (let i = 0; i < hashTags.length; i++) {
      const hashTag = hashTags[i].trim();
      const word = hashTag.substring(1, hashTag.length);
      res.push({ type: 'hashTag', word })
    }
  }
  return res
}

// singleBracketに囲まれた部分のうち、pageLinkだけを回収する
const filterPageLinks = (parsedObjects) => {
  const res = []
  for (const obj of parsedObjects) {
    // console.log(obj)
    let {word, type} = obj
    if (!word || !type) continue
    if (type === 'inlineCode' || type === 'bold') continue
    word = word.trim()
    const toks = word.split(' ')
    if (toks.length === 1) {
      if (word.match(/\.icon/)) continue
      if (!word.startsWith('http') && !word.startsWith('/')) {
        res.push({ type: 'pageLink', word })
      }
    } else {
      const w = []
      let ok = true
      for (let i = 0; i < toks.length; i++) {
        const t = toks[i]
        if (/[\/\*\-\{\}\~\_\!\$\#]/.test(t.charAt(0))) {
          ok = false
          continue
        }
        if (t.startsWith('http')) {
          ok = false
          continue
        }
        w.push(t)
      }
      if (ok && w.length > 0) {
        word = w.join(' ')
        res.push({ type: 'pageLink', word })
      }
    }
  }
  return res
}

const parseRow = (line) => {
  if (!line || line.length === 0) return null
  if (!isTargetLine(line)) return null

  // [...] 記法を取得する
  exstractScrapboxSyntax(line, 0, 0, null)
  let res = cloneDeep(dicts)
  // #... 記法を取得する
  const hashTags = extractHashTags(line)
  res = filterPageLinks(res)
  res.push.apply(res, hashTags)
  return uniq(res)
}

const ignoreCodeBlock = line => {
  const c0 = line.charAt(0)
  line = line.trim()
  if (line.startsWith('code:')) Flags.codeBlock = true
  if (Flags.codeBlock) {
    if (c0 !== ' ' && c0 === '\t') Flags.codeBlock = false
  }
}

const ignoreShellLine = line => {
  Flags.shellLine = line.startsWith('$')
}

const isTargetLine = (line) => {
  ignoreCodeBlock(line)
  ignoreShellLine(line)
  return !Flags.codeBlock && !Flags.shellLine
}

module.exports = {parseRow, initParser, initFlags}
