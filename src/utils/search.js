/**
 * Splitting the inputs into 3 letters for search indexing.
 * + first letter
 * + first two letters combination
 * to increase the quality
 *
 * @returns [Array]
 */
const createEdgeNGrams = (input) => {
	const result = [];

	for (const word of input.split(/[\s-]/)) {
		if (!word) continue;

		const codePoints = Array.from(word);

		for (let start = 0; start < codePoints.length; start++) {
			let current = '';
			for (let end = start; end < codePoints.length; end++) {
				current += codePoints[end];
				result.push(current);
			}
		}
	}

	return result;
};

// Example usage:
const splitForSearchIndexes = (...searchTexts) => {
	return searchTexts.flatMap((text) => createEdgeNGrams(text));
};

module.exports = {
	splitForSearchIndexes,
};
