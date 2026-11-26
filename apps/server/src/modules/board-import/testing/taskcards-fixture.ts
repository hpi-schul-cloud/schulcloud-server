import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The fixtures are recorded answers of the test boards of the team. They contain no board of a user.
export const readTaskcardsFixture = (name: string): string => {
	const fixture = readFileSync(join(__dirname, 'fixtures/taskcards', name), 'utf8');

	return fixture;
};
