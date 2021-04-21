const paginationWhitelist = ['$limit', '$skip'];
const orderWhitelist = ['$sort'];
const selectWhitelist = ['$select'];
const filterWhitelist = ['$exists'];

/** default whitelist which should be added to all our (mongoose-)feathers services which can be used securely. */
const defaultWhitelist = [...paginationWhitelist, ...orderWhitelist, ...selectWhitelist, ...filterWhitelist];

/** allow some logical operations */
const logicOperations = { NOR: '$nor', OR: '$or', AND: '$and', GT: '$gt', LT: '$lt', EQ: '$eq', NEQ: '$neq' };

/**
 * required somewhere,  at least rest-services no more should use it
 * @deprecated
 */
const populateWhitelist = ['$populate'];

/** required in files & teams, at least rest-services no more should use it
 * @deprecated
 * */
const regexWhitelist = ['$elemMatch', '$regex'];

const defaultModelServiceWhitelist = [
	...defaultWhitelist,
	...populateWhitelist,
	...regexWhitelist,
	...Object.values(logicOperations),
];

module.exports = {
	defaultWhitelist,
	logicOperations,
	regexWhitelist,
	defaultModelServiceWhitelist,
};
