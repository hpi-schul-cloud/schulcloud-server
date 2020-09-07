const CLASS_NAME_FORMATS = [
	{
		regex: /^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/,
		values: async (string) => {
			const gradeLevel = string.match(/^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/)[1];

			return {
				name: string.match(/^(?:0)*(?:(?:1[0-3])|[1-9])(\D.*)$/)[1],
				gradeLevel,
			};
		},
	},
	{
		regex: /(.*)/,
		values: (string) => ({
			name: string,
		}),
	},
];

/**
 * Creates a new class-like object that can be used to create or update a
 * class from a given name.
 *
 * Optionally extends a given object as second parameter. Note, that in this
 * case, `name` and `gradeLevel` of the given object will be overridden by
 * the parsed class name.
 * @param {String} className a string to be parsed as class name
 * @param {Object} attributes optional base object to extend
 * @returns {Class} a class-like object
 */
const classObjectFromName = async (className, attributes) => {
	const classNameFormat = CLASS_NAME_FORMATS.find((format) => format.regex.test(className));
	if (classNameFormat !== undefined) {
		return {
			...attributes,
			...(await classNameFormat.values(className)),
		};
	}
	throw new Error('Class name does not match any format:', className);
};

module.exports = {
	classObjectFromName,
	CLASS_NAME_FORMATS,
};
