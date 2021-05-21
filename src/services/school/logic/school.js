const { URL } = require('url');
const { Configuration } = require('@hpi-schul-cloud/commons');
const logger = require('../../../logger');

const getDocumentBaseDir = (school) => {
	// parse id eventually from populated schoolGroup if defined, otherwise set false
	const groupId = school.schoolGroupId ? school.schoolGroupId._id || school.schoolGroupId : false;
	let schoolBaseDir;
	switch (school.documentBaseDirType) {
		case 'school':
			//  use school id
			schoolBaseDir = `${Configuration.get('SC_THEME')}/${school._id}/`;
			break;
		case 'schoolGroup':
			// use schoolGroup id
			if (!groupId) {
				logger.error('school group id requested but not defined', school);
				schoolBaseDir = `${Configuration.get('SC_THEME')}/`;
				break;
			}
			schoolBaseDir = `${Configuration.get('SC_THEME')}/${groupId}/`;
			break;
		default:
			schoolBaseDir = `${Configuration.get('SC_THEME')}/`;
			break;
	}
	return String(new URL(schoolBaseDir, Configuration.get('DOCUMENT_BASE_DIR')));
};

module.exports = { getDocumentBaseDir };
