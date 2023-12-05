/*
ignore the typescript error in the feathersjs ts declarations
using "skipLibCheck": true in tsconfig.json is not wanted for a single declaration error
references:
	 https://github.com/feathersjs/feathers/discussions/3351
	 https://github.com/microsoft/TypeScript/issues/38538

usage: node add-ts-nocheck.js in package.json scripts
*/
const fs = require('fs');

const ADDED_STR = '// @ts-nocheck\n\n';
const FILES = ['node_modules/@feathersjs/express/lib/declarations.d.ts'];

Promise.allSettled(FILES.map(addTsNoCheck)).then((results) => {
	let hasErrors = false;

	for (const result of results) {
		if (result.status === 'rejected') {
			hasErrors = true;
			console.error(result.reason);
		}
	}

	if (hasErrors) {
		process.exit(1);
	}
});

async function addTsNoCheck(file) {
	const content = fs.readFileSync(file).toString();

	if (content.includes(ADDED_STR)) {
		console.log(JSON.stringify(ADDED_STR), 'is already in', file);
	} else {
		fs.writeFileSync(file, ADDED_STR + content);
		console.log(JSON.stringify(ADDED_STR), 'added into', file);
	}
}
