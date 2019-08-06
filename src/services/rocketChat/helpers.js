exports.makeStringRCConform = (input) => {
	const dict = {
		ä: 'ae', Ä: 'Ae', ö: 'oe', Ö: 'Oe', ü: 'ue', Ü: 'Ue', ' ': '-', ß: 'ss',
	};
	const inputResolvedUmlauts = input.replace(/[äÄöÖüÜß ]/g, match => dict[match]);
	return inputResolvedUmlauts.replace(/[^\w\d.\-_]/g, '_');
};
