import { ObjectId } from '@mikro-orm/mongodb';
import { FilePermissionReferenceModel } from '../domain';
import { FilePermissionEntity } from './file-permission.entity';

describe(FilePermissionEntity.name, () => {
	describe('constructor', () => {
		describe('should set proper fields values', () => {
			const setup = () => {
				const refId = new ObjectId();
				const refPermModel = FilePermissionReferenceModel.USER;

				return { refId, refPermModel };
			};

			it('for the minimal valid props object', () => {
				const { refId, refPermModel } = setup();

				const entity = new FilePermissionEntity({
					refId: refId.toHexString(),
					refPermModel,
				});

				expect(entity).toEqual(
					expect.objectContaining({
						refId,
						refPermModel,
						write: true,
						read: true,
						create: true,
						delete: true,
					})
				);
			});

			it('from the provided complete props object', () => {
				const { refId, refPermModel } = setup();

				const entity = new FilePermissionEntity({
					refId: refId.toHexString(),
					refPermModel,
					write: false,
					read: false,
					create: false,
					delete: false,
				});

				expect(entity).toEqual(
					expect.objectContaining({
						refId,
						refPermModel,
						write: false,
						read: false,
						create: false,
						delete: false,
					})
				);
			});
		});
	});
});
