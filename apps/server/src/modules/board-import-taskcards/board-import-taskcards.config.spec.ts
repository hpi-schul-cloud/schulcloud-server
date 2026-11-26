import { validateSync } from 'class-validator';
import { BoardImportTaskcardsConfig } from './board-import-taskcards.config';

describe(BoardImportTaskcardsConfig.name, () => {
	describe('boardHosts', () => {
		const setup = (boardHosts?: string[]) => {
			const config = new BoardImportTaskcardsConfig();
			if (boardHosts) {
				config.boardHosts = boardHosts;
			}

			return { config };
		};

		describe('when no value is set', () => {
			it('should permit the TaskCards domains and their subdomains', () => {
				const { config } = setup();

				const errors = validateSync(config);

				expect(errors).toHaveLength(0);
				expect(config.boardHosts).toEqual(['taskcards.de', '*.taskcards.de', 'taskcards.app', '*.taskcards.app']);
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
