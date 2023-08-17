import { ObjectId } from '@mikro-orm/mongodb';

import { FilePermissionEntity } from '@shared/domain';

import { FilePermissionMapper } from './file-permission.mapper';
import { FilePermission, FilePermissionReferenceModel } from '../../domain';

describe(FilePermissionMapper.name, () => {
	describe('mapToDOs', () => {
		it('should return empty domain objects array for an empty entities array', () => {
			const domainObjects = FilePermissionMapper.mapToDOs([]);

			expect(domainObjects).toEqual([]);
		});

		it('should properly map the entities to the domain objects', () => {
			const entities = [
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
			];

			const domainObjects = FilePermissionMapper.mapToDOs(entities);

			const expectedDomainObjects = entities.map(
				(entity) =>
					new FilePermission({
						referenceId: entity.refId.toHexString(),
						referenceModel: entity.refPermModel,
						readPermission: entity.read,
						writePermission: entity.write,
						createPermission: entity.create,
						deletePermission: entity.delete,
					})
			);

			expect(domainObjects).toEqual(expectedDomainObjects);
		});
	});
});
