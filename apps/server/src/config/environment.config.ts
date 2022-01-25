import globals = require('../../../../config/globals');

interface Environment {
	NODE_ENV: string;
}

const usedGlobals: Environment = globals;

/** Environment */
export const { NODE_ENV } = usedGlobals;
