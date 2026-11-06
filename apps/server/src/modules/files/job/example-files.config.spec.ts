import 'reflect-metadata';
import { parseExampleFilesConfig } from './example-files.config';

describe(parseExampleFilesConfig.name, () => {
	it('should apply defaults and parse a valid config', () => {
		const config = parseExampleFilesConfig({ counts: { personal: 1, course: 2, teams: 3 } });

		expect(config.namePrefix).toBe('generated-');
		expect(config.brokenTeamsFiles.directories).toBe(0);
		expect(config.counts.teams).toBe(3);
	});

	it('should throw for negative counts', () => {
		expect(() => parseExampleFilesConfig({ counts: { personal: -1 } })).toThrow();
	});

	it('should throw if broken files exceed the teams count', () => {
		expect(() =>
			parseExampleFilesConfig({
				counts: { teams: 2 },
				brokenTeamsFiles: { noStorageProvider: 2, directories: 1 },
			})
		).toThrow('must not exceed');
	});

	it('should throw for invalid user ids', () => {
		expect(() => parseExampleFilesConfig({ counts: {}, userIds: ['nope'] })).toThrow();
	});
});
