'use strict'

var gh = require('../util/gh')
var shaEnd = require('../util/sha-end')
var locator = require('../util/regex-locator')
var abbr = require('../util/abbreviate')

module.exports = hash

hash.locator = locator(/\b[a-f\d]{7,40}\b/gi)
hash.notInLink = true

var commitPage = 'commit'
var slash = '/'

// Denylist of SHAs that are also valid words.
//
// GitHub allows abbreviating SHAs up to 7 characters.
// These cases are ignored in text because they might just be ment as normal
// words.
// If you’d like these to link to their SHAs, use more than 7 characters.
//
// Generated by:
//
// ```sh
// egrep -i "^[a-f0-9]{7,}$" /usr/share/dict/words
// ```
//
// Added a couple forms of 6 character words in GH-20:
// <https://github.com/remarkjs/remark-github/issues/20>.
var denylist = ['acceded', 'deedeed', 'defaced', 'effaced', 'fabaceae']

// Tokenise a hash.
function hash(eat, value, silent) {
  var self = this
  var index = shaEnd(value, 0)
  var subvalue
  var now
  var node
  var exit

  if (index === -1) {
    return
  }

  subvalue = value.slice(0, index)

  if (denied(subvalue)) {
    return
  }

  /* istanbul ignore if - Maybe used by plugins? */
  if (silent) {
    return true
  }

  now = eat.now()
  exit = self.enterLink()

  node = eat(subvalue)({
    type: 'link',
    title: null,
    url: gh(self.githubRepo) + commitPage + slash + subvalue,
    children: self.tokenizeInline(subvalue, now)
  })

  exit()

  node.children = [
    {
      type: 'inlineCode',
      value: abbr(subvalue),
      position: node.children[0].position
    }
  ]

  return node
}

// Check if a value is a denied SHA.
function denied(sha) {
  return denylist.indexOf(sha.toLowerCase()) !== -1
}
