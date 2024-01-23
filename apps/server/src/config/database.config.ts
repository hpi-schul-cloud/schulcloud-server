import globals = require('../../../../config/globals');

interface GlobalConstants {
	DB_URL: string;
	DB_PASSWORD?: string;
	DB_USERNAME?: string;
	TLDRAW_DB_URL: string;
}

const usedGlobals: GlobalConstants = globals;

/** Database URL */
export const { DB_URL, DB_PASSWORD, DB_USERNAME, TLDRAW_DB_URL } = usedGlobals;
