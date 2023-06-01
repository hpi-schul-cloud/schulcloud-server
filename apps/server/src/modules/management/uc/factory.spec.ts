import { generateRole } from '../seed-data/roles';

describe('test factory', () => {
	it('test roles', () => {
		const roles = generateRole();
		console.log(roles);
	});
});
