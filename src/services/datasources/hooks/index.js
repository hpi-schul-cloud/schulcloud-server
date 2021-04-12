const updatedBy = require('./updatedBy');
const createdBy = require('./createdBy');
const getDatasource = require('./getDatasource');
const restrictToDatasourceSchool = require('./restrictToDatasourceSchool');
const protectFields = require('./protectFields');
const validateParams = require('./validateParams');

module.exports = {
	updatedBy,
	createdBy,
	getDatasource,
	restrictToDatasourceSchool,
	protectFields,
	validateParams,
};
