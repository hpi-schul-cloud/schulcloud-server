/* eslint no-console: 0 */
/* eslint global-require: 0 */
/* eslint import/no-dynamic-require: 0 */
const fs = require('fs');

const dry = process.argv.indexOf('--dry') > -1;

fs.readdirSync(`${__dirname}/`)
	.filter(file => (file.indexOf('index.js') === -1 && file.split('/').pop().split('.').pop() === 'js'))
	.forEach((file) => {
		const { ran, name, run } = require(`./${file}`);
		if (!ran && run && typeof run === 'function') {
			console.log(`Running Migration "${name}" from file: ${file}`);
			run(dry)
				.then(() => {
					console.log('Finished');
					process.exit(0);
				})
				.catch((e) => {
					console.log('Finished with errors', e);
					process.exit(0);
				});
		}
	});
