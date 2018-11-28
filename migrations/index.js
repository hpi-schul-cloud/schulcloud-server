const fs = require('fs');
const dry = process.argv.indexOf('--dry') > -1;

fs.readdirSync(`${__dirname}/`)
	.filter(file => (file.indexOf('index.js') === -1 && file.split('/').pop().split('.').pop() === 'js'))
	.forEach((file) => {
		const {ran, name, run} = require(`./${file}`);
		if( !ran && run && typeof run === 'function' ) {
			console.log(`Running Migration "${name}" from file: ${file}`);
			run(dry);
		}
	});
