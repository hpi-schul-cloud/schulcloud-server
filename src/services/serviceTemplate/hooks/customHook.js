/* eslint max-lines-per-function: ["error", 8] */

/**
 * this hook implements some custom functionality, described in this comment.
 * please consider if this functionality can be covered with feathers common hooks, found here:
 * https://feathers-plus.github.io/v1/feathers-hooks-common/index.html#Hooks
 * @param context the feathers hook context.
 */
module.exports = (context) => {
	context.data.createdBy = (context.params.account || {}).userId;
	return context;
};
