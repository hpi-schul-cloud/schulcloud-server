/* eslint max-lines-per-function: ["error", 8] */

/**
 * this hook implements some custom functionality, described in this comment.
 * @param context the feathers hook context.
 */
module.exports = (context) => {
	// do some simple logic.
	if (context.data.magicNumber) {
		context.data.magicNumber += 2;
	}
	return context;
};
