export class MongoPatterns {
	/**
	 * Regex to escape strings before use as regex against database.
	 * Used to remove all non-language characters except numbers, whitespace or minus.
	 */
	static REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST =
		/[^\-_\w\d áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒß]/gi;
}
