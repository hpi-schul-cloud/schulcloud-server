import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { Logger } from '@src/core/logger';
import { FileLegacyService } from './file-legacy.service';

describe('Etherpad service', () => {
	let module: TestingModule;
	let fileLegacyService: FileLegacyService;
	let feathersServiceProvider: DeepMocked<FeathersServiceProvider>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FileLegacyService,
				{
					provide: FeathersServiceProvider,
					useValue: createMock<FeathersServiceProvider>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		fileLegacyService = module.get(FileLegacyService);
		feathersServiceProvider = module.get(FeathersServiceProvider);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('copyCourseFile', () => {
		const oldFileId = 'f123';
		it('it should call feathers service', async () => {
			feathersServiceProvider
				.getService('/fileStorage/coursefilecopy')
				.create.mockResolvedValue({ oldFileId, fileId: 'f234', filename: 'abc.jpg' });

			const result = await fileLegacyService.copyFile({ userId: 'u123', targetCourseId: 'c123', fileId: oldFileId });
			expect(result.oldFileId).toEqual('f123');
			expect(result.fileId).toEqual('f234');
			expect(result.filename).toEqual('abc.jpg');
		});

		it('should return only oldFileId if courseFileCopy call fails', async () => {
			feathersServiceProvider.getService('/fileStorage/coursefilecopy').create.mockRejectedValue({});

			const result = await fileLegacyService.copyFile({ userId: 'u123', targetCourseId: 'c123', fileId: oldFileId });
			expect(result).toEqual({ oldFileId });
		});
	});
});
