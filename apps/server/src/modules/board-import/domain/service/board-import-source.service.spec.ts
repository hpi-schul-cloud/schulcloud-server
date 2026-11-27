import { Test, type TestingModule } from '@nestjs/testing';
import { BoardImportLinkInvalidLoggableException, BoardImportSourceUnknownLoggableException } from '../error';
import { type BoardImportSourceDefinition } from '../interface';
import { BoardImportSourceRegistryService } from './board-import-source-registry.service';
import { BoardImportSourceService } from './board-import-source.service';

describe(BoardImportSourceService.name, () => {
	let module: TestingModule;
	let service: BoardImportSourceService;

	const definition: BoardImportSourceDefinition = {
		type: 'test-source',
		boardHosts: ['source.example', '*.source.example', 'source.test', '*.source.test'],
		switchKey: 'TEST_SOURCE_ENABLED',
	};
	const otherDefinition: BoardImportSourceDefinition = {
		type: 'other-source',
		boardHosts: ['other.example'],
		switchKey: 'OTHER_SOURCE_ENABLED',
	};
	const subdomainDefinition: BoardImportSourceDefinition = {
		type: 'subdomain-source',
		boardHosts: ['*.subdomains.example'],
		switchKey: 'SUBDOMAIN_SOURCE_ENABLED',
	};
	const overlappingDefinition: BoardImportSourceDefinition = {
		type: 'overlapping-source',
		boardHosts: ['boards.source.example'],
		switchKey: 'OVERLAPPING_SOURCE_ENABLED',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [BoardImportSourceService, BoardImportSourceRegistryService],
		}).compile();

		service = module.get(BoardImportSourceService);
		const registry = module.get(BoardImportSourceRegistryService);
		[definition, otherDefinition, subdomainDefinition, overlappingDefinition].forEach((source) =>
			registry.registerSource(source)
		);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('resolveSource', () => {
		describe('when the link points to a host of a source', () => {
			it.each([
				'https://www.source.example/#/board/793bed21-a8ac-4a26-910e-2c3305ac6c0d?token=0599256f',
				'https://source.example/board/1',
				'https://source.test/#/board/1',
				'https://bra.source.test/#/board/1',
				'https://a.b.source.test/#/board/1',
			])('should return the source with the link "%s"', (link: string) => {
				const result = service.resolveSource(link);

				expect(result).toEqual({ type: definition.type, link });
			});
		});

		describe('when the link to a host of a source is not in the normalized form', () => {
			it.each([
				{ link: 'https://WWW.Source.example/#/board/1', normalizedLink: 'https://www.source.example/#/board/1' },
				{ link: 'https://www.source.example:443/#/board/1', normalizedLink: 'https://www.source.example/#/board/1' },
				{ link: 'https:www.source.example/#/board/1', normalizedLink: 'https://www.source.example/#/board/1' },
				{ link: 'https://source.example\\@evil.example/', normalizedLink: 'https://source.example/@evil.example/' },
				{ link: 'https://source%2eexample/board', normalizedLink: 'https://source.example/board' },
				{ link: 'https://www.sour\nce.example/board', normalizedLink: 'https://www.source.example/board' },
				{ link: 'https://school\u00AD.source.test/', normalizedLink: 'https://school.source.test/' },
			])('should return the normalized link for "$link"', ({ link, normalizedLink }) => {
				const result = service.resolveSource(link);

				expect(result).toEqual({ type: definition.type, link: normalizedLink });
			});
		});

		describe('when the link is not a valid https link to a host name', () => {
			it.each([
				'http://www.source.example/#/board/1',
				'ftp://www.source.example/',
				'file:///etc/passwd',
				'javascript:alert(1)',
				'not a link',
				'',
				'https://',
				'https://user:pw@www.source.example/',
				'https://source.example@evil.example/',
				'https://www.source.example:8443/',
				'https://www.source.example./#/board/1',
				'https://www.source.example\u3002/#/board/1',
				'https://www.source.example\uFF61/#/board/1',
				'https://127.0.0.1/',
				'https://10.0.0.5/',
				'https://169.254.169.254/',
				'https://8.8.8.8/',
				'https://2130706433/',
				'https://0x7f.0.0.1/',
				'https://[::1]/',
				'https://[2001:db8::1]/',
				'https:///path',
				'https://.source.example/',
				'https://x..source.example/',
				'https://-x.source.example/',
				'https://x_y.source.example/',
			])('should throw a link invalid exception for "%s"', (link: string) => {
				expect(() => service.resolveSource(link)).toThrow(BoardImportLinkInvalidLoggableException);
			});
		});

		describe('when the host of the link is not in the list of a source', () => {
			it.each([
				'https://example.com/board',
				'https://www.edumaps.de/84762/371448/x/y',
				'https://padlet.com/user/wall',
				'https://source.example.evil.example/',
				'https://evilsource.example/',
				'https://source.com/',
			])('should throw a source unknown exception for "%s"', (link: string) => {
				expect(() => service.resolveSource(link)).toThrow(BoardImportSourceUnknownLoggableException);
			});
		});

		describe('when the list of a source has only a subdomain pattern', () => {
			it('should not accept the domain itself', () => {
				expect(() => service.resolveSource('https://subdomains.example/')).toThrow(
					BoardImportSourceUnknownLoggableException
				);
			});

			it('should accept a subdomain', () => {
				const link = 'https://school.subdomains.example/';

				const result = service.resolveSource(link);

				expect(result).toEqual({ type: subdomainDefinition.type, link });
			});
		});

		describe('when the link points to a host of the second source', () => {
			it('should return the second source', () => {
				const link = 'https://other.example/board/1';

				const result = service.resolveSource(link);

				expect(result).toEqual({ type: otherDefinition.type, link });
			});
		});
	});

	describe('isLinkOfSource', () => {
		describe('when the link is a valid link to a host of the source', () => {
			it.each(['https://www.source.example/graphql', 'https://bra.source.test/api/boards'])(
				'should return true for "%s"',
				(link: string) => {
					const result = service.isLinkOfSource(link, definition.type);

					expect(result).toBe(true);
				}
			);
		});

		describe('when the link is not a valid link to a host of the source', () => {
			it.each([
				'http://www.source.example/graphql',
				'https://evil.example/graphql',
				'https://source.example.evil.example/',
				'https://127.0.0.1/',
				'https://[::1]/',
				'https://169.254.169.254/',
				'https://api-svc/',
				'https://user:pw@www.source.example/',
				'https://www.source.example:8443/',
				'not a link',
			])('should return false for "%s"', (link: string) => {
				const result = service.isLinkOfSource(link, definition.type);

				expect(result).toBe(false);
			});
		});
		describe('when the link is a valid link to a host of another source', () => {
			it('should return false', () => {
				const result = service.isLinkOfSource('https://other.example/graphql', definition.type);

				expect(result).toBe(false);
			});
		});

		describe('when the host is also a host of a source that was registered before', () => {
			it('should return true', () => {
				const result = service.isLinkOfSource('https://boards.source.example/graphql', overlappingDefinition.type);

				expect(result).toBe(true);
			});
		});

		describe('when no source with the type is registered', () => {
			it('should return false', () => {
				const result = service.isLinkOfSource('https://www.source.example/graphql', 'removed-source');

				expect(result).toBe(false);
			});
		});
	});

	describe('getSwitchKey', () => {
		describe('when a source with the type is registered', () => {
			it('should return the switch key of the source', () => {
				const result = service.getSwitchKey(otherDefinition.type);

				expect(result).toEqual(otherDefinition.switchKey);
			});
		});

		describe('when no source with the type is registered', () => {
			it('should throw a source unknown exception', () => {
				expect(() => service.getSwitchKey('removed-source')).toThrow(BoardImportSourceUnknownLoggableException);
			});
		});
	});
});
