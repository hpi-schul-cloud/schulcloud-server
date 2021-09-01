const { Configuration } = require('@hpi-schul-cloud/commons');

const FEATURE_ADMIN_TOGGLE_STUDENT_VISIBILITY_ENABLED = Configuration.get(
	'FEATURE_ADMIN_TOGGLE_STUDENT_VISIBILITY_ENABLED'
);
const defaultStudentList = FEATURE_ADMIN_TOGGLE_STUDENT_VISIBILITY_ENABLED
	? {}
	: {
			teacher: {
				STUDENT_LIST: true,
			},
	  };

module.exports = defaultStudentList;
