/**
 * Splitting the inputs into 3 letters for search indexing.
 * + first letter
 * + first two letters combination
 * to increase the quality
 *
 * @returns [Array]
 */
const createAllSubstrings = (input, minLength) => {
	const result = [];

	for (const word of input.split(/[\s-]/)) {
		if (!word) continue;

		const codePoints = Array.from(word);

		for (let start = 0; start < codePoints.length; start++) {
			let current = '';
			for (let end = start; end < codePoints.length; end++) {
				current += codePoints[end];
				if (current.length >= minLength) {
					result.push(current);
				}
			}
		}
	}

	return result;
};

// Explicit minLength version
const splitForSearchIndexesWithMinLength = (minLength, ...searchTexts) => {
	return searchTexts.flatMap((text) => createAllSubstrings(text, minLength));
};

// Default version with minLength = 3
const splitForSearchIndexes = (...searchTexts) => {
	return splitForSearchIndexesWithMinLength(3, ...searchTexts.filter((text) => text != null));
};

module.exports = {
	splitForSearchIndexes,
};
