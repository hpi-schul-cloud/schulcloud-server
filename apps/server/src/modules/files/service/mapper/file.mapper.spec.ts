import { ObjectId } from '@mikro-orm/mongodb';

import { StorageProviderEntity } from '@shared/domain';
import { FileEntity, FileSecurityCheckEntity, FilePermissionEntity } from '../../entity';

import { File, FileOwnerModel, FilePermissionReferenceModel, FileSecurityCheckStatus } from '../../domain';
import { FileMapper } from './file.mapper';
import { FileSecurityCheckMapper } from './file-security-check.mapper';
import { FilePermissionMapper } from './file-permission.mapper';

describe(FileMapper.name, () => {
	describe('mapToDOs', () => {
		it('should return empty domain objects array for an empty entities array', () => {
			const domainObjects = FileMapper.mapToDOs([]);

			expect(domainObjects).toEqual([]);
		});

		it('should properly map the entities to the domain objects', () => {
			const entities = [
				new FileEntity({
					createdAt: new Date(2023, 8, 1),
					updatedAt: new Date(2023, 8, 15),
					deletedAt: new Date(2023, 9, 1),
					deleted: true,
					isDirectory: true,
					name: 'test-file-0.txt',
					size: 42,
					type: 'text/plain',
					storageFileName: '000-test-file-0.txt',
					bucket: 'bucket-000',
					storageProvider: new StorageProviderEntity({
						endpointUrl: 'https://example.com/storage',
						accessKeyId: 'fc5a9603-7030-4d15-83dd-5110a0a89ad5',
						secretAccessKey: '4a9ff291-2799-4c44-9077-20ccbd79d055',
						region: 'eu-central-1',
					}),
					thumbnail: 'https://example.com/thumbnail.png',
					thumbnailRequestToken: 'e17a273d-b7fa-40ea-b958-77bc121e92e1',
					securityCheck: new FileSecurityCheckEntity({
						status: FileSecurityCheckStatus.VERIFIED,
						reason: 'AV scanning done',
						requestToken: '69bfad17-3e0e-453f-824a-3565a1106872',
					}),
					shareTokens: [
						'5f2737c3-4062-44c4-a0d3-8421cd33a512',
						'a23f9039-bc72-4a4a-afc6-8a77f7bf7090',
						'9cec5614-ae2d-42ae-9dd5-0f77c7e8901f',
					],
					parentId: new ObjectId().toHexString(),
					ownerId: new ObjectId().toHexString(),
					refOwnerModel: FileOwnerModel.COURSE,
					creatorId: new ObjectId().toHexString(),
					permissions: [
						new FilePermissionEntity({
							refId: new ObjectId().toHexString(),
							refPermModel: FilePermissionReferenceModel.USER,
							read: true,
							write: true,
							create: true,
							delete: true,
						}),
						new FilePermissionEntity({
							refId: new ObjectId().toHexString(),
							refPermModel: FilePermissionReferenceModel.USER,
							read: true,
							write: false,
							create: false,
							delete: false,
						}),
						new FilePermissionEntity({
							refId: new ObjectId().toHexString(),
							refPermModel: FilePermissionReferenceModel.ROLE,
							read: true,
							write: true,
							create: false,
							delete: false,
						}),
					],
					lockId: new ObjectId().toHexString(),
					versionKey: 2,
				}),
			];

			const domainObjects = FileMapper.mapToDOs(entities);

			const expectedDomainObjects = entities.map(
				(entity) =>
					new File({
						id: entity.id,
						createdAt: entity.createdAt,
						updatedAt: entity.updatedAt,
						deletedAt: entity.deletedAt,
						deleted: entity.deleted,
						isDirectory: entity.isDirectory,
						name: entity.name,
						size: entity.size,
						type: entity.type,
						storageFileName: entity.storageFileName,
						bucket: entity.bucket,
						storageProviderId: entity.storageProvider?.id,
						thumbnail: entity.thumbnail,
						thumbnailRequestToken: entity.thumbnailRequestToken,
						securityCheck: FileSecurityCheckMapper.mapToDO(entity.securityCheck),
						shareTokens: entity.shareTokens,
						parentId: entity.parentId,
						ownerId: entity.ownerId,
						ownerModel: entity.refOwnerModel,
						creatorId: entity.creatorId,
						permissions: FilePermissionMapper.mapToDOs(entity.permissions),
						lockId: entity.lockId,
					})
			);

			expect(domainObjects).toEqual(expectedDomainObjects);
		});
	});
});
