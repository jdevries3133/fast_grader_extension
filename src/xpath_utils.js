/**
 * Copyright (C) 2021 John DeVries
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Various functions for traversing the DOM with xpaths.
 */

const makeXpath = (node) => {
  if (node.tagName == "HTML") return "/HTML[1]";
  if (node === document.body) return "/HTML[1]/BODY[1]";

  var ix = 0;
  var siblings = node.parentNode.childNodes;
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i];
    if (sibling === node)
      return (
        makeXpath(node.parentNode) + "/" + node.tagName + "[" + (ix + 1) + "]"
      );
    if (sibling.nodeType === 1 && sibling.tagName === node.tagName) ix++;
  }
};

/**
 * Given a context node and an xpath to describe the route from that
 * node to another, return the resultant node.
 * @param {node} node DOM node to search from
 * @param {string} xpath Describes route from node to target
 * @param {boolean} many Whether the xpath should return one or many nodes.
 */
const nodeToXpath = (node, xpath, many) => {
  const fullXp = makeXpath(node) + "/" + xpath;
  const rval = many ? getMany(fullXp) : getOne(fullXp);
  return rval;
};

/**
 * Return document node at a single xpath, or throw an error
 */
const getOne = (xpath, contextNode = null) => {
  const node = document.evaluate(
    xpath,
    document,
    contextNode,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
  if (node) {
    return node;
  }
  throw new Error(`Single node not found for xpath: "${xpath}"`);
};

/**
 * Get an array of nodes for selector that are expected to return many,
 * or throw an error.
 */
const getMany = (xpath, contextNode = document) => {
  let nodes = [];
  try {
    const result = document.evaluate(
      xpath,
      contextNode,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i));
    }
  } catch (e) {
    throw new Error(
      `Failed to get many nodes for xpath "${xpath}" due to exception ${e}`
    );
  }
  return nodes;
};

const getTopicRootElements = () => {
  return getMany('//*[@id="c1"]/div/div/div[4]/ol/li/div[1]/div/a');
};
