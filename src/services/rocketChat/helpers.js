/**
 * returns a valid string for rocket chat usernames, channelnames, and the like.
 * Invalid characters in the input string are replaced with valid ones.
 * @param {String} input
 * @returns {String} a valid string for use in rocketChat.
 */
exports.makeStringRCConform = (input) => {
	const dict = {
		ä: 'ae',
		Ä: 'Ae',
		ö: 'oe',
		Ö: 'Oe',
		ü: 'ue',
		Ü: 'Ue',
		' ': '-',
		ß: 'ss',
	};
	const inputResolvedUmlauts = input.replace(/[äÄöÖüÜß ]/g, (match) => dict[match]);
	return inputResolvedUmlauts.replace(/[^\w\d.\-_]/g, '_');
};
