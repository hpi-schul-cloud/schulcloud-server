import { validateSync } from 'class-validator';
import { BoardImportConfig, BoardImportSourceConfig, BoardImportSourceRequestConfig } from './board-import.config';

describe(BoardImportConfig.name, () => {
	describe('jobRetentionInDays', () => {
		const setup = (jobRetentionInDays: number) => {
			const config = new BoardImportConfig();
			config.jobRetentionInDays = jobRetentionInDays;

			return { config };
		};

		describe('when the value is 49 days', () => {
			it('should be valid', () => {
				const { config } = setup(49);

				const errors = validateSync(config);

				expect(errors).toHaveLength(0);
			});
		});

		describe('when the value is above 49 days', () => {
			it('should be invalid', () => {
				const { config } = setup(50);

				const errors = validateSync(config);

				expect(errors).toHaveLength(1);
				expect(errors[0].constraints).toHaveProperty('max');
			});
		});
	});
});

describe(BoardImportSourceConfig.name, () => {
	describe('taskcardsBoardHosts', () => {
		const setup = (taskcardsBoardHosts?: string[]) => {
			const config = new BoardImportSourceConfig();
			if (taskcardsBoardHosts) {
				config.taskcardsBoardHosts = taskcardsBoardHosts;
			}

			return { config };
		};

		describe('when no value is set', () => {
			it('should permit the TaskCards domains and their subdomains', () => {
				const { config } = setup();

				const errors = validateSync(config);

				expect(errors).toHaveLength(0);
				expect(config.taskcardsBoardHosts).toEqual([
					'taskcards.de',
					'*.taskcards.de',
					'taskcards.app',
					'*.taskcards.app',
				]);
			});
		});

		describe('when the entries are host names and subdomain patterns', () => {
			it('should be valid', () => {
				const { config } = setup(['a.example', '*.b.example', 'x-1.sub.c.example']);

				const errors = validateSync(config);

				expect(errors).toHaveLength(0);
			});
		});

		describe('when the list is empty', () => {
			it('should be invalid', () => {
				const { config } = setup([]);

				const errors = validateSync(config);

				expect(errors).toHaveLength(1);
				expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
			});
		});

		describe('when an entry is not a host name or a subdomain pattern', () => {
			it.each([
				'',
				'https://taskcards.de',
				'taskcards.de/path',
				'*taskcards.de',
				'foo.*.de',
				'*.*.taskcards.de',
				'TaskCards.de',
				'taskcards.de.',
				'127.0.0.1',
				'localhost',
			])('should be invalid for "%s"', (entry: string) => {
				const { config } = setup(['taskcards.de', entry]);

				const errors = validateSync(config);

				expect(errors).toHaveLength(1);
				expect(errors[0].constraints).toHaveProperty('matches');
			});
		});
	});
});

describe(BoardImportSourceRequestConfig.name, () => {
	describe('when no value is set', () => {
		it('should be valid with the default limits', () => {
			const config = new BoardImportSourceRequestConfig();

			const errors = validateSync(config);

			expect(errors).toHaveLength(0);
			expect(config).toEqual({ requestTimeoutInSeconds: 30, maxResponseSizeInBytes: 10485760, maxRedirects: 3 });
		});
	});

	describe('when no redirect is permitted', () => {
		it('should be valid', () => {
			const config = new BoardImportSourceRequestConfig();
			config.maxRedirects = 0;

			const errors = validateSync(config);

			expect(errors).toHaveLength(0);
		});
	});

	describe('when a limit is below its minimum', () => {
		it.each([
			{ property: 'requestTimeoutInSeconds' as const, value: 0 },
			{ property: 'maxResponseSizeInBytes' as const, value: 0 },
			{ property: 'maxRedirects' as const, value: -1 },
		])('should be invalid for $property = $value', ({ property, value }) => {
			const config = new BoardImportSourceRequestConfig();
			config[property] = value;

			const errors = validateSync(config);

			expect(errors).toHaveLength(1);
			expect(errors[0].constraints).toHaveProperty('min');
		});
	});
});
