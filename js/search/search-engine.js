/**
 * GM ARCH TOOLS — Deterministic Ranked Local Search Engine
 * Searches all 35 Arch Calculatives with strict priority ranking,
 * partial word matching, multi-word matching, and keyboard navigation.
 */

import { ARCH_CALCULATIVES } from '../data/tools-database.js';

export const SUGGESTED_SEARCHES = [
  'Plot',
  'FSI',
  'Parking',
  'Area',
  'Coverage',
  'Height'
];

/**
 * Clean and normalize search query string
 */
function normalizeQuery(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\-\/]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Score a tool against a normalized query string
 * Ranking Priority:
 * 1. Exact tool name match (Score: 100)
 * 2. Partial tool name match (Score: 75)
 * 3. Keyword match (Score: 50)
 * 4. Description match (Score: 25)
 * 5. Category match (Score: 10)
 */
function scoreTool(tool, query) {
  if (!query) return 0;

  const toolNameLower = tool.name.toLowerCase();
  const toolIdLower = tool.id.toLowerCase();
  const descLower = tool.description.toLowerCase();
  const purposeLower = (tool.purpose || '').toLowerCase();
  const catLower = tool.category.toLowerCase();
  const formulaLower = (tool.formula || '').toLowerCase();

  let score = 0;
  let matchType = '';

  // Direct ID match (e.g. "01", "3", "tool 03")
  if (query === toolIdLower || query === `tool ${parseInt(tool.id, 10)}` || query === `tool ${tool.id}`) {
    return { score: 110, matchType: 'id_match' };
  }

  // 1. Exact tool name match
  if (toolNameLower === query) {
    return { score: 100, matchType: 'exact_name' };
  }

  // 2. Partial tool name match (tool name starts with or contains query)
  if (toolNameLower.startsWith(query)) {
    score = Math.max(score, 85);
    matchType = 'name_prefix';
  } else if (toolNameLower.includes(query)) {
    score = Math.max(score, 75);
    matchType = 'name_contains';
  }

  // Check multi-word query tokens against tool name
  const queryTokens = query.split(' ').filter(Boolean);
  if (queryTokens.length > 1) {
    const allTokensInName = queryTokens.every(token => toolNameLower.includes(token));
    if (allTokensInName) {
      score = Math.max(score, 80);
      matchType = 'name_multi_token';
    }
  }

  // 3. Keyword / Tag match
  if (tool.keywords && tool.keywords.length > 0) {
    for (const kw of tool.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === query) {
        score = Math.max(score, 65); // exact keyword
        matchType = matchType || 'keyword_exact';
        break;
      } else if (kwLower.startsWith(query)) {
        score = Math.max(score, 55); // keyword prefix
        matchType = matchType || 'keyword_prefix';
      } else if (kwLower.includes(query)) {
        score = Math.max(score, 50); // keyword substring
        matchType = matchType || 'keyword_contains';
      }
    }
  }

  // Also check tags
  if (tool.tags) {
    for (const tag of tool.tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower === query || tagLower.startsWith(query)) {
        score = Math.max(score, 45);
        matchType = matchType || 'tag_match';
      }
    }
  }

  // 4. Description & Purpose match
  if (descLower.includes(query) || purposeLower.includes(query) || formulaLower.includes(query)) {
    score = Math.max(score, 25);
    matchType = matchType || 'description_match';
  }

  // 5. Category match
  if (catLower.includes(query)) {
    score = Math.max(score, 10);
    matchType = matchType || 'category_match';
  }

  // Multi-token fallback (e.g. "plot area", "balance fsi", "ground coverage")
  if (score === 0 && queryTokens.length > 1) {
    let tokensMatched = 0;
    const combinedText = `${toolNameLower} ${descLower} ${catLower} ${(tool.keywords || []).join(' ')}`.toLowerCase();
    
    for (const t of queryTokens) {
      if (combinedText.includes(t)) {
        tokensMatched++;
      }
    }

    if (tokensMatched === queryTokens.length) {
      score = 40;
      matchType = 'composite_match';
    } else if (tokensMatched > 0) {
      score = (tokensMatched / queryTokens.length) * 20;
      matchType = 'partial_token_match';
    }
  }

  return { score, matchType };
}

/**
 * Search the 35 tools database
 * @param {string} rawQuery 
 * @param {object} options 
 * @returns {Array<object>} Ranked tool results
 */
export function searchTools(rawQuery, options = {}) {
  const query = normalizeQuery(rawQuery);
  if (!query) {
    return [];
  }

  const results = [];

  for (const tool of ARCH_CALCULATIVES) {
    const { score, matchType } = scoreTool(tool, query);
    if (score > 0) {
      results.push({
        tool,
        score,
        matchType
      });
    }
  }

  // Sort descending by score, tie-break by Tool ID ascending
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return parseInt(a.tool.id, 10) - parseInt(b.tool.id, 10);
  });

  const limit = options.limit || 15;
  return results.slice(0, limit).map(r => r.tool);
}
