import { Test, type TestingModule } from '@nestjs/testing';
import dns from 'node:dns';
import { BOARD_IMPORT_SOURCE_CONFIG_TOKEN, BoardImportSourceConfig } from '../../board-import.config';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, BoardImportSourceType } from '../type';
import { BoardImportLinkCheckService } from './board-import-link-check.service';
import { BoardImportSourceService } from './board-import-source.service';

describe(BoardImportLinkCheckService.name, () => {
	let module: TestingModule;
	let service: BoardImportLinkCheckService;
	let lookup: jest.SpyInstance;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportLinkCheckService,
				BoardImportSourceService,
				{ provide: BOARD_IMPORT_SOURCE_CONFIG_TOKEN, useValue: new BoardImportSourceConfig() },
			],
		}).compile();

		service = module.get(BoardImportLinkCheckService);
	});

	beforeEach(() => {
		lookup = jest.spyOn(dns.promises, 'lookup');
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const expectRejected = async (url: string): Promise<void> => {
		const error = await service.check(new URL(url), BoardImportSourceType.TASKCARDS).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(BoardImportJobRejectedError);
		expect(error).toHaveProperty('reason', BoardImportJobLogReason.SOURCE_LINK_REJECTED);
	};

	describe('check', () => {
		describe('when the host is in the list and resolves to public addresses', () => {
			const setup = () => {
				const url = new URL('https://www.taskcards.de/graphql');
				const addresses = [
					{ address: '2606:4700:4700::1111', family: 6 },
					{ address: '93.184.216.34', family: 4 },
				];
				lookup.mockResolvedValueOnce(addresses);

				return { url, addresses };
			};

			it('should return the first address', async () => {
				const { url, addresses } = setup();

				const result = await service.check(url, BoardImportSourceType.TASKCARDS);

				expect(result).toEqual(addresses[0]);
			});

			it('should look up all addresses of the host', async () => {
				const { url } = setup();

				await service.check(url, BoardImportSourceType.TASKCARDS);

				expect(lookup).toHaveBeenCalledWith('www.taskcards.de', { all: true });
			});
		});

		describe('when the URL breaks the link rules or the host is not in the list', () => {
			it.each([
				'http://www.taskcards.de/graphql',
				'https://evil.example/graphql',
				'https://taskcards.de.evil.example/',
				'https://127.0.0.1/',
				'https://[::1]/',
				'https://169.254.169.254/',
				'https://user:pw@www.taskcards.de/',
				'https://www.taskcards.de:8443/',
			])('should reject "%s" without a lookup', async (url: string) => {
				await expectRejected(url);

				expect(lookup).not.toHaveBeenCalled();
			});
		});

		describe('when the host resolves to an address that is not public', () => {
			it.each([
				{ name: 'a loopback address', addresses: [{ address: '127.0.0.1', family: 4 }] },
				{ name: 'the metadata address', addresses: [{ address: '169.254.169.254', family: 4 }] },
				{ name: 'a private IPv6 address', addresses: [{ address: 'fd12::1', family: 6 }] },
				{
					name: 'one public and one private address',
					addresses: [
						{ address: '93.184.216.34', family: 4 },
						{ address: '10.0.0.5', family: 4 },
					],
				},
				{ name: 'no address', addresses: [] },
			])('should reject a host with $name', async ({ addresses }) => {
				lookup.mockResolvedValueOnce(addresses);

				await expectRejected('https://www.taskcards.de/graphql');
			});
		});

		describe('when the host does not exist', () => {
			it('should reject the URL', async () => {
				lookup.mockRejectedValueOnce(Object.assign(new Error('not found'), { code: 'ENOTFOUND' }));

				await expectRejected('https://www.taskcards.de/graphql');
			});
		});

		describe('when the lookup fails temporarily', () => {
			it('should throw an error that is not a rejection', async () => {
				lookup.mockRejectedValueOnce(Object.assign(new Error('try again'), { code: 'EAI_AGAIN' }));

				const error = await service
					.check(new URL('https://www.taskcards.de/graphql'), BoardImportSourceType.TASKCARDS)
					.catch((e: unknown) => e);

				expect(error).toBeInstanceOf(Error);
				expect(error).not.toBeInstanceOf(BoardImportJobRejectedError);
			});
		});
	});
});
