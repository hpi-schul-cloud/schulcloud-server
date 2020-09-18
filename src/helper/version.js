const fs = require('fs');
const path = require('path');

const logger = require('../logger');

const getLine = (stringArr, i) => {
	if (stringArr && stringArr.length > i && i >= 0) {
		return stringArr[i].trim();
	}
	return null;
};

const getLines = (stringArr, start, end) => {
	if (!end) {
		// response with single line
		return getLine(stringArr, start);
	}
	// response with multiline
	const retValue = [];
	for (let i = start; i <= end; i += 1) {
		const line = getLine(stringArr, i);
		if (line) {
			retValue.push(line);
		}
	}
	return retValue.join('\n');
};

let sha = false;
let branch = false;
let message = false;
let stat = {};

try {
	const filePath = path.join(__dirname, '../../', 'version');
	const versionFileLines = fs.readFileSync(filePath, 'utf8').split('\n');
	stat = fs.statSync(filePath);
	sha = getLines(versionFileLines, 0);
	branch = getLines(versionFileLines, 1);
	message = getLines(versionFileLines, 2, versionFileLines.length);
} catch (error) {
	logger.error('Can not read version file.');
}

module.exports = {
	sha,
	branch,
	message,
	stat,
};
