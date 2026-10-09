import { groupEntityFactory } from '@modules/group/testing';
import { mediaGroupLicenseEntityFactory } from '../testing';

describe('GroupLicenseEntity (via MediaGroupLicenseEntity)', () => {
	describe('constructor', () => {
		it('should set the provided id when given', () => {
			const group = groupEntityFactory.buildWithId();
			const id = 'custom-id-1234';
			const entity = mediaGroupLicenseEntityFactory.build({ group, id });

			expect(entity.id).toBe(id);
		});

		it('should not override id when not provided', () => {
			const group = groupEntityFactory.buildWithId();
			const entity = mediaGroupLicenseEntityFactory.build({ group });

			expect(entity.mediumId).toBeDefined();
		});
	});
});
