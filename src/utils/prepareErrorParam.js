/**
 * This is to pass errors as second parameter in feather errors that it is write in .data = <myError>.
 * The problem by errors is, that they have not iterable keys. But feathers want to iterate all second + param inputs.
 *	message { value: 'test',
 *		writable: true,
 *		enumerable: false, <-- problem
 *		configurable: true }
 * But to call the value directly is no problem.
 * @param {*} err - Can handle generic errors, errors with new Error, or new <featherError>, null and undefined
 * @example throw new Forbidden('Message', prepareErrorParam(err));
 */
const prepareErrorParam = (err) => {
	if (!err) { // undefined and null
		return err;
	}
	if (typeof err === 'string') {
		return {
			message: err,
		};
	}
	return {
		code: err.code,
		stack: err.stack,
		message: err.message,
		className: err.className,
		name: err.name,
		data: err.data,
		type: err.type,
	};
};
module.exports = prepareErrorParam;