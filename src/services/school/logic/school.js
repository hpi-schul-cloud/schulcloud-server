const { URL } = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');
const logger = require('../../../logger');
const { SC_THEME } = require('../../../../config/globals');

const getDocumentBaseDir = (school) => {
	// parse id eventually from populated schoolGroup if defined, otherwise set false
	const groupId = school.schoolGroupId ? school.schoolGroupId._id || school.schoolGroupId : false;
	let schoolBaseDir;
	switch (school.documentBaseDirType) {
		case 'school':
			//  use school id
			schoolBaseDir = `${SC_THEME}/${school._id}/`;
			break;
		case 'schoolGroup':
			// use schoolGroup id
			if (!groupId) {
				logger.error('school group id requested but not defined', school);
				schoolBaseDir = `${SC_THEME}/`;
				break;
			}
			schoolBaseDir = `${SC_THEME}/${groupId}/`;
			break;
		default:
			schoolBaseDir = `${SC_THEME}/`;
			break;
	}
	return String(new URL(schoolBaseDir, Configuration.get('DOCUMENT_BASE_DIR')));
};

module.exports = { getDocumentBaseDir };
