/**
 * Splitting the inputs into 3 letters for search indexing.
 * + first letter
 * + first two letters combination
 * to increase the quality
 *
 * @param {*} string
 * @returns [Array]
 */
const splitForSearchIndexes = (...searchTexts) => {
	const arr = [];
	searchTexts.forEach((item) => {
		item.split(/[\s-]/g).forEach((it) => {
			// eslint-disable-next-line no-plusplus
			if (it.length === 0) return;

			arr.push(it.slice(0, 1));
			if (it.length > 1) arr.push(it.slice(0, 2));
			for (let i = 0; i < it.length - 2; i += 1) arr.push(it.slice(i, i + 3));
		});
	});
	return arr;
};

module.exports = {
	splitForSearchIndexes,
};
