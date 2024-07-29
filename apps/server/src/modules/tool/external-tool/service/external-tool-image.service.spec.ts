import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { FileRecordResponse } from '@modules/files-storage/controller/dto';
import { FileRecordParentType, StorageLocation } from '@modules/files-storage/interface';
import { InstanceService } from '@modules/instance';
import { instanceFactory } from '@modules/instance/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory, fileRecordFactory } from '@shared/testing';
import { of } from 'rxjs';
import { ToolConfig } from '../../tool-config';
import { FileRecordRef } from '../domain';
import { ExternalToolImageService } from './external-tool-image.service';

const createAxiosResponse = <T>(data: T) =>
	axiosResponseFactory.build({
		data,
	});

describe(ExternalToolImageService.name, () => {
	let module: TestingModule;
	let service: ExternalToolImageService;

	let httpService: DeepMocked<HttpService>;
	let instanceService: DeepMocked<InstanceService>;

	const config: Partial<ToolConfig> = {
		FILES_STORAGE__SERVICE_BASE_URL: 'https://files-storage-service.com',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolImageService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof ToolConfig) => config[key]),
					},
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: InstanceService,
					useValue: createMock<InstanceService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolImageService);
		httpService = module.get(HttpService);
		instanceService = module.get(InstanceService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('uploadImageFileFromUrl', () => {
		const setup = () => {
			const fileRecordId = new ObjectId().toHexString();
			const externalToolId = new ObjectId().toHexString();
			const fileNameAffix = 'fileNameAffix';
			const jwt = 'jwt';

			const instance = instanceFactory.build();
			instanceService.getInstance.mockResolvedValueOnce(instance);

			const fileStorageUrl = config.FILES_STORAGE__SERVICE_BASE_URL || '';

			const fileRecordResponse = new FileRecordResponse(fileRecordFactory.build());

			httpService.post.mockReturnValue(of(createAxiosResponse(fileRecordResponse)));

			return {
				fileRecordId,
				externalToolId,
				fileNameAffix,
				jwt,
				instance,
				fileStorageUrl,
				fileRecordResponse,
			};
		};

		it('should call InstanceService', async () => {
			const { externalToolId, fileNameAffix, jwt } = setup();

			await service.uploadImageFileFromUrl('url', fileNameAffix, externalToolId, jwt);

			expect(instanceService.getInstance).toHaveBeenCalled();
		});

		it('should call HttpService', async () => {
			const { externalToolId, fileNameAffix, jwt, fileStorageUrl, instance } = setup();

			await service.uploadImageFileFromUrl('url', fileNameAffix, externalToolId, jwt);

			expect(httpService.post).toHaveBeenCalledWith(
				`${fileStorageUrl}/api/v3/file/upload-from-url/${StorageLocation.INSTANCE}/${instance.id}/${FileRecordParentType.ExternalTool}/${externalToolId}`,
				{
					url: 'url',
					fileName: `external-tool-${fileNameAffix}-${externalToolId}`,
				},
				{
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				}
			);
		});

		it('should return FileRecordRef', async () => {
			const { externalToolId, fileNameAffix, jwt, fileRecordResponse } = setup();

			const result: FileRecordRef = await service.uploadImageFileFromUrl('url', fileNameAffix, externalToolId, jwt);

			expect(result).toEqual(
				expect.objectContaining({
					uploadUrl: 'url',
					fileName: `external-tool-${fileNameAffix}-${externalToolId}`,
					fileRecordId: fileRecordResponse.id,
				})
			);
		});
	});

	describe('deleteImageFile', () => {
		const setup = () => {
			const fileRecordId = new ObjectId().toHexString();
			const jwt = 'jwt';
			const fileStorageUrl = config.FILES_STORAGE__SERVICE_BASE_URL || '';

			httpService.delete.mockReturnValue(of(createAxiosResponse({})));

			return {
				fileRecordId,
				jwt,
				fileStorageUrl,
			};
		};

		it('should call HttpService', async () => {
			const { fileRecordId, jwt, fileStorageUrl } = setup();

			await service.deleteImageFile(fileRecordId, jwt);

			expect(httpService.delete).toHaveBeenCalledWith(`${fileStorageUrl}/api/v3/file/delete/${fileRecordId}`, {
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			});
		});
	});

	describe('deleteAllFiles', () => {
		const setup = () => {
			const fileRecordId = new ObjectId().toHexString();
			const jwt = 'jwt';
			const fileStorageUrl = config.FILES_STORAGE__SERVICE_BASE_URL || '';

			httpService.delete.mockReturnValue(of(createAxiosResponse({})));
			const instance = instanceFactory.build();
			instanceService.getInstance.mockResolvedValueOnce(instance);

			return {
				fileRecordId,
				jwt,
				fileStorageUrl,
				instance,
			};
		};

		it('should call HttpService', async () => {
			const { fileRecordId, jwt, fileStorageUrl, instance } = setup();

			await service.deleteAllFiles(fileRecordId, jwt);

			expect(httpService.delete).toHaveBeenCalledWith(
				`${fileStorageUrl}/api/v3/file/delete/${StorageLocation.INSTANCE}/${instance.id}/${FileRecordParentType.ExternalTool}/${fileRecordId}`,
				{
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				}
			);
		});
	});
});
