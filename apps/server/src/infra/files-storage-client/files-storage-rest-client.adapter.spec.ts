import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@shared/testing';
import { ErrorLogger } from '@src/core/logger';
import { FilesStorageRestClientAdapter } from './files-storage-rest-client.adapter';
import { FileApi } from './generated';

describe(FilesStorageRestClientAdapter.name, () => {
	let module: TestingModule;
	let sut: FilesStorageRestClientAdapter;
	let fileApiMock: DeepMocked<FileApi>;
	let errorLoggerMock: DeepMocked<ErrorLogger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FilesStorageRestClientAdapter,
				{
					provide: FileApi,
					useValue: createMock<FileApi>(),
				},
				{
					provide: ErrorLogger,
					useValue: createMock<ErrorLogger>(),
				},
			],
		}).compile();

		sut = module.get(FilesStorageRestClientAdapter);
		fileApiMock = module.get(FileApi);
		errorLoggerMock = module.get(ErrorLogger);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('download', () => {
		describe('when download succeeds', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();

				fileApiMock.download.mockResolvedValueOnce(axiosResponseFactory.build({ data: Buffer.from('') }));

				return {
					fileRecordId,
					fileName,
				};
			};

			it('should return the response buffer', async () => {
				const { fileRecordId, fileName } = setup();

				const result = await sut.download(fileRecordId, fileName);

				expect(result).toEqual(Buffer.from(''));
				expect(fileApiMock.download).toBeCalledWith(fileRecordId, fileName, undefined, {
					responseType: 'arraybuffer',
				});
			});
		});

		describe('when download fails', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();

				fileApiMock.download.mockRejectedValueOnce(new Error('error'));

				return {
					fileRecordId,
					fileName,
				};
			};

			it('should return null', async () => {
				const { fileRecordId, fileName } = setup();

				const result = await sut.download(fileRecordId, fileName);

				expect(result).toBeNull();
				expect(errorLoggerMock.error).toBeCalled();
			});
		});
	});
});
