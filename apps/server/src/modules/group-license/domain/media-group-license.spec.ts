import { ObjectId } from '@mikro-orm/mongodb';
import { mediaGroupLicenseFactory } from '../testing';
import { GroupLicenseType } from '../enum';

describe('MediaGroupLicense domain object', () => {
	describe('getters and setters', () => {
		it('should return groupId', () => {
			const groupId = new ObjectId().toHexString();
			const license = mediaGroupLicenseFactory.build({ groupId });
			expect(license.groupId).toBe(groupId);
		});

		it('should allow setting groupId', () => {
			const license = mediaGroupLicenseFactory.build();
			const newGroupId = new ObjectId().toHexString();
			license.groupId = newGroupId;
			expect(license.groupId).toBe(newGroupId);
		});

		it('should return type', () => {
			const license = mediaGroupLicenseFactory.build({ type: GroupLicenseType.MEDIA_LICENSE });
			expect(license.type).toBe(GroupLicenseType.MEDIA_LICENSE);
		});

		it('should return mediumId', () => {
			const license = mediaGroupLicenseFactory.build({ mediumId: 'test-medium' });
			expect(license.mediumId).toBe('test-medium');
		});

		it('should allow setting mediumId', () => {
			const license = mediaGroupLicenseFactory.build();
			license.mediumId = 'new-medium';
			expect(license.mediumId).toBe('new-medium');
		});

		it('should return mediaSource', () => {
			const license = mediaGroupLicenseFactory.build();
			expect(license.mediaSource).toBeDefined();
		});

		it('should return undefined mediaSource when not set', () => {
			const license = mediaGroupLicenseFactory.build({ mediaSource: undefined });
			expect(license.mediaSource).toBeUndefined();
		});
	});
});
