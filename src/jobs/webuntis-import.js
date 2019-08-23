const database = require('../utils/database');

/**
 * NOTE: Quick-start for this job is to run 'node src/jobs/webuntis-import.js'.
 * It is expected to pass MongoDB parameters as process environment variables.
 * Please see src/utils/database.js for more.
*/

async function run() {
	await database.connect();

	// TODO: implement

	await database.close();
	process.exit(0);
}

run();
