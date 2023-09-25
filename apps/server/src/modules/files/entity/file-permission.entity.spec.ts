import { ObjectId } from '@mikro-orm/mongodb';
import { FilePermissionReferenceModel } from '../domain';
import { FilePermissionEntity } from './file-permission.entity';

describe(FilePermissionEntity.name, () => {
	describe('constructor', () => {
		const setup = () => {
			const refId = new ObjectId();
			const refPermModel = FilePermissionReferenceModel.USER;

			return { refId, refPermModel };
		};

		describe('when passed a minimal valid props object', () => {
			it(`should return a valid ${FilePermissionEntity.name} object with proper default fields values and with the values taken from the passed props object`, () => {
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
		});

		describe('when passed a complete (fully filled) props object', () => {
			it(`should return a valid ${FilePermissionEntity.name} object with proper fields values taken from the passed props object`, () => {
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
