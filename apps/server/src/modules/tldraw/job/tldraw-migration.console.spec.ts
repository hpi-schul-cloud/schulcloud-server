import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { S3ClientAdapter } from '@infra/s3-client';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { S3_CONNECTION_NAME } from '../config';
import { WsSharedDocDo } from '../domain';
import { YMongodb } from '../repo';
import { TldrawMigrationConsole } from './tldraw-migration.console';

jest.mock('yjs', () => {
	return {
		Doc: jest.fn(),
		encodeStateAsUpdateV2: jest.fn().mockReturnValue('encodedState'),
	};
});

jest.mock('uuid', () => {
	return {
		v4: jest.fn().mockReturnValue('uuid'),
	};
});

describe(TldrawMigrationConsole.name, () => {
	let console: TldrawMigrationConsole;
	let yMongodb: DeepMocked<YMongodb>;
	let s3Adapter: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TldrawMigrationConsole,
				{
					provide: S3_CONNECTION_NAME,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: YMongodb,
					useValue: createMock<YMongodb>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		console = module.get(TldrawMigrationConsole);
		s3Adapter = module.get(S3_CONNECTION_NAME);
		yMongodb = module.get(YMongodb);
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('migrate', () => {
		it('should migrate all documents', async () => {
			const docNames = ['doc1', 'doc2'];
			const doc1 = {
				name: 'doc1',
				store: { pendingStructs: 'pendingStructs', pendingDs: 'pendingDs' },
			} as unknown as WsSharedDocDo;
			const doc2 = {
				name: 'doc2',
				store: { pendingStructs: 'pendingStructs', pendingDs: 'pendingDs' },
			} as unknown as WsSharedDocDo;
			yMongodb.getAllDocumentNames.mockResolvedValue(docNames);
			yMongodb.getDocument.mockImplementation((docName: string) => {
				if (docName === 'doc1') {
					return Promise.resolve(doc1);
				}
				if (docName === 'doc2') {
					return Promise.resolve(doc2);
				}
				throw new Error('Invalid docName');
			});
			s3Adapter.create.mockImplementation((key) => Promise.resolve({ Key: key } as any));

			const result = await console.migrate();

			expect(result).toEqual(['doc1/index/uuid', 'doc2/index/uuid']);
			expect(yMongodb.getAllDocumentNames).toBeCalledTimes(1);
			expect(yMongodb.getDocument).toBeCalledTimes(2);
			expect(s3Adapter.create).toBeCalledTimes(2);
		});
	});
});
