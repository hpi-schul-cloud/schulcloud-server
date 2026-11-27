import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_SOURCE_CONFIG_TOKEN, BoardImportSourceConfig } from '../../board-import.config';
import { BoardImportLinkInvalidLoggableException, BoardImportSourceUnknownLoggableException } from '../error';
import { BoardImportSourceType } from '../type';
import { BoardImportSourceService } from './board-import-source.service';

describe(BoardImportSourceService.name, () => {
	let module: TestingModule;
	let service: BoardImportSourceService;
	let config: BoardImportSourceConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportSourceService,
				{
					provide: BOARD_IMPORT_SOURCE_CONFIG_TOKEN,
					useValue: new BoardImportSourceConfig(),
				},
			],
		}).compile();

		service = module.get(BoardImportSourceService);
		config = module.get(BOARD_IMPORT_SOURCE_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		config.taskcardsBoardHosts = new BoardImportSourceConfig().taskcardsBoardHosts;
	});

	describe('resolveSource', () => {
		describe('when the link points to a TaskCards host', () => {
			it.each([
				'https://www.taskcards.de/#/board/793bed21-a8ac-4a26-910e-2c3305ac6c0d?token=0599256f',
				'https://taskcards.de/board/1',
				'https://taskcards.app/#/board/1',
				'https://bra.taskcards.app/#/board/1',
				'https://a.b.taskcards.app/#/board/1',
			])('should return the TaskCards source with the link "%s"', (link: string) => {
				const result = service.resolveSource(link);

				expect(result).toEqual({ type: BoardImportSourceType.TASKCARDS, link });
			});
		});

		describe('when the link to a TaskCards host is not in the normalized form', () => {
			it.each([
				{ link: 'https://WWW.TaskCards.de/#/board/1', normalizedLink: 'https://www.taskcards.de/#/board/1' },
				{ link: 'https://www.taskcards.de:443/#/board/1', normalizedLink: 'https://www.taskcards.de/#/board/1' },
				{ link: 'https:www.taskcards.de/#/board/1', normalizedLink: 'https://www.taskcards.de/#/board/1' },
				{ link: 'https://taskcards.de\\@evil.example/', normalizedLink: 'https://taskcards.de/@evil.example/' },
				{ link: 'https://taskcards%2ede/board', normalizedLink: 'https://taskcards.de/board' },
				{ link: 'https://www.task\ncards.de/board', normalizedLink: 'https://www.taskcards.de/board' },
				{ link: 'https://school\u00AD.taskcards.app/', normalizedLink: 'https://school.taskcards.app/' },
			])('should return the normalized link for "$link"', ({ link, normalizedLink }) => {
				const result = service.resolveSource(link);

				expect(result).toEqual({ type: BoardImportSourceType.TASKCARDS, link: normalizedLink });
			});
		});

		describe('when the link is not a valid https link to a host name', () => {
			it.each([
				'http://www.taskcards.de/#/board/1',
				'ftp://www.taskcards.de/',
				'file:///etc/passwd',
				'javascript:alert(1)',
				'not a link',
				'',
				'https://',
				'https://user:pw@www.taskcards.de/',
				'https://taskcards.de@evil.example/',
				'https://www.taskcards.de:8443/',
				'https://www.taskcards.de./#/board/1',
				'https://www.taskcards.de\u3002/#/board/1',
				'https://www.taskcards.de\uFF61/#/board/1',
				'https://127.0.0.1/',
				'https://10.0.0.5/',
				'https://169.254.169.254/',
				'https://8.8.8.8/',
				'https://2130706433/',
				'https://0x7f.0.0.1/',
				'https://[::1]/',
				'https://[2001:db8::1]/',
				'https:///path',
				'https://.taskcards.de/',
				'https://x..taskcards.de/',
				'https://-x.taskcards.de/',
				'https://x_y.taskcards.de/',
			])('should throw a link invalid exception for "%s"', (link: string) => {
				expect(() => service.resolveSource(link)).toThrow(BoardImportLinkInvalidLoggableException);
			});
		});

		describe('when the host of the link is not in the list of a source', () => {
			it.each([
				'https://example.com/board',
				'https://www.edumaps.de/84762/371448/x/y',
				'https://padlet.com/user/wall',
				'https://taskcards.de.evil.example/',
				'https://eviltaskcards.de/',
				'https://taskcards.com/',
			])('should throw a source unknown exception for "%s"', (link: string) => {
				expect(() => service.resolveSource(link)).toThrow(BoardImportSourceUnknownLoggableException);
			});
		});

		describe('when the list has only a subdomain pattern', () => {
			const setup = () => {
				config.taskcardsBoardHosts = ['*.taskcards.app'];
			};

			it('should not accept the domain itself', () => {
				setup();

				expect(() => service.resolveSource('https://taskcards.app/')).toThrow(
					BoardImportSourceUnknownLoggableException
				);
			});

			it('should accept a subdomain', () => {
				setup();
				const link = 'https://school.taskcards.app/';

				const result = service.resolveSource(link);

				expect(result).toEqual({ type: BoardImportSourceType.TASKCARDS, link });
			});
		});
	});

	describe('isLinkOfSource', () => {
		describe('when the link is a valid link to a host of the source', () => {
			it.each(['https://www.taskcards.de/graphql', 'https://bra.taskcards.app/api/boards'])(
				'should return true for "%s"',
				(link: string) => {
					const result = service.isLinkOfSource(link, BoardImportSourceType.TASKCARDS);

					expect(result).toBe(true);
				}
			);
		});

		describe('when the link is not a valid link to a host of the source', () => {
			it.each([
				'http://www.taskcards.de/graphql',
				'https://evil.example/graphql',
				'https://taskcards.de.evil.example/',
				'https://127.0.0.1/',
				'https://[::1]/',
				'https://169.254.169.254/',
				'https://api-svc/',
				'https://user:pw@www.taskcards.de/',
				'https://www.taskcards.de:8443/',
				'not a link',
			])('should return false for "%s"', (link: string) => {
				const result = service.isLinkOfSource(link, BoardImportSourceType.TASKCARDS);

				expect(result).toBe(false);
			});
		});
	});
});
