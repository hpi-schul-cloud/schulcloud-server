import { Test } from '@nestjs/testing';
import { Doc } from 'yjs';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { createConfigModuleOptions } from '@src/config';
import { TldrawBoardRepo } from './tldraw-board.repo';
import { WsSharedDocDo } from '../domain';
import { tldrawTestConfig } from '../testing';
import { TldrawDrawing } from '../entities';
import { YMongodb } from './y-mongodb';

describe('TldrawBoardRepo', () => {
	let repo: TldrawBoardRepo;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
				ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig)),
			],
			providers: [
				TldrawBoardRepo,
				{
					provide: YMongodb,
					useValue: createMock<YMongodb>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		repo = testingModule.get(TldrawBoardRepo);

		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should check if repo and its properties are set correctly', () => {
		expect(repo).toBeDefined();
		expect(repo.mdb).toBeDefined();
	});

	describe('getYDocFromMdb', () => {
		describe('when taking doc data from db', () => {
			const setup = () => {
				const storeGetYDocSpy = jest.spyOn(repo.mdb, 'getDocument').mockResolvedValueOnce(new WsSharedDocDo('TEST'));

				return {
					storeGetYDocSpy,
				};
			};

			it('should return ydoc', async () => {
				const { storeGetYDocSpy } = setup();

				const result = await repo.getDocumentFromDb('test');

				expect(result).toBeInstanceOf(Doc);
				storeGetYDocSpy.mockRestore();
			});
		});
	});

	describe('compressDocument', () => {
		const setup = () => {
			const flushDocumentSpy = jest.spyOn(repo.mdb, 'compressDocumentTransactional').mockResolvedValueOnce();

			return { flushDocumentSpy };
		};

		it('should call compress method on YMongo', async () => {
			const { flushDocumentSpy } = setup();

			await repo.compressDocument('test');

			expect(flushDocumentSpy).toHaveBeenCalled();
			flushDocumentSpy.mockRestore();
		});
	});

	describe('storeUpdate', () => {
		const setup = () => {
			const storeUpdateSpy = jest.spyOn(repo.mdb, 'storeUpdateTransactional').mockResolvedValue(2);
			const compressDocumentSpy = jest.spyOn(repo.mdb, 'compressDocumentTransactional').mockResolvedValueOnce();

			return {
				storeUpdateSpy,
				compressDocumentSpy,
			};
		};

		it('should call store update method on YMongo', async () => {
			const { storeUpdateSpy } = setup();

			await repo.storeUpdate('test', new Uint8Array());

			expect(storeUpdateSpy).toHaveBeenCalled();
			storeUpdateSpy.mockRestore();
		});

		it('should call compressDocument if compress threshold was reached', async () => {
			const { storeUpdateSpy, compressDocumentSpy } = setup();

			await repo.storeUpdate('test', new Uint8Array());

			expect(storeUpdateSpy).toHaveBeenCalled();
			expect(compressDocumentSpy).toHaveBeenCalled();
			storeUpdateSpy.mockRestore();
		});
	});
});
