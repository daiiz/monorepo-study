const {ScrapboxPageLinkExtractor} = require('./scrapbox/pageLinkExtractor')
const {sortedUniq} = require('lodash')

window.scrapbox2triples = {}

let triples = []
const initTriples = () => {
  triples = []
  window.scrapbox2triples.triples = triples
}

window.scrapbox2triples.main = (pageData={}, projectName='') => {
  window.scrapbox2triples.projectName = projectName
  const pages = pageData.pages
  let tripleSum = 0
  initTriples()
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const s = page.title; // 主語
    let lines = page.lines;
    // 一行ずつ解析する
    const links = []
    for (let j = 0; j < lines.length; j++) {
      // title行はスキップ
      if (j === 0) continue
      let line = lines[j];
      let extractor = new ScrapboxPageLinkExtractor(line, projectName);

      // Scrapboxの純粋なリンクキーワードを取得
      let linkPages = extractor.extractPageLink();
      links.push.apply(links, linkPages)
    }

    const pagesLinks = sortedUniq(links)
    console.groupCollapsed(`${s} (${pagesLinks.length})`)
    for (const o of pagesLinks) {
      // 保存されるRDFトリプル
      const triple = [s, o.type, o.word]
      triples.push(triple)
      console.log(o)
    }
    if (!!projectName) {
      console.log(`https://scrapbox.io/${projectName}/${encodeURIComponent(s)}`)
    }
    console.groupEnd()
    tripleSum += pagesLinks.length
  }
  console.log(`${tripleSum} triples`)
}

window.scrapbox2triples.v1format = function () {
  return {
    name: this.projectName,
    data: this.triples
  }
}

initTriples()
