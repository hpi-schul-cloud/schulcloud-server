const { Configuration } = require('@hpi-schul-cloud/commons');
const { URL } = require('url');
const logger = require('../../../logger');
const { DOCUMENT_BASE_DIR } = require('../../../../config/globals');

const getDocumentBaseDir = (school) => {
	// parse id eventually from populated schoolGroup if defined, otherwise set false
	const groupId = school.schoolGroupId ? school.schoolGroupId._id || school.schoolGroupId : false;
	let schoolBaseDir;
	switch (school.documentBaseDirType) {
		case 'school':
			//  use school id
			schoolBaseDir = `${Configuration.get('SC__THEME')}/${school._id}/`;
			break;
		case 'schoolGroup':
			// use schoolGroup id
			if (!groupId) {
				logger.error('school group id requested but not defined', school);
				schoolBaseDir = `${Configuration.get('SC__THEME')}/`;
				break;
			}
			schoolBaseDir = `${Configuration.get('SC__THEME')}/${groupId}/`;
			break;
		default:
			schoolBaseDir = `${Configuration.get('SC__THEME')}/`;
			break;
	}
	return String(new URL(schoolBaseDir, DOCUMENT_BASE_DIR));
};

module.exports = { getDocumentBaseDir };
