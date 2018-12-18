// [PageLink], #Hashtag
const {parseRow, initParser, initFlags} = require('./easy-parser');

class ScrapboxPageLinkExtractor {
  constructor (line='', projectName='daiiz') {
    this.rawRow = line;
    this.projectName = projectName;
  }

  static initParser () {
    initParser()
  }

  /* 純粋なScrapboxリンクを抽出 */
  extractPageLink () {
    initParser()
    initFlags()
    const res = parseRow(this.rawRow, this.projectName);
    return res
  }

}

module.exports = {ScrapboxPageLinkExtractor};
