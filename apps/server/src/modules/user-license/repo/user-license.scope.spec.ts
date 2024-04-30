import { UserLicenseType } from '../entity';
import { UserLicenseScope } from './user-license.scope';

describe(UserLicenseScope.name, () => {
	let userLicenseScope: UserLicenseScope;

	beforeEach(() => {
		userLicenseScope = new UserLicenseScope();
	});

	describe('byType', () => {
		describe('when type is undefined', () => {
			it('should return scope without type', () => {
				expect(userLicenseScope.byType()).toBe(userLicenseScope);
			});
		});

		describe('when type is defined', () => {
			it('should add type to query', () => {
				const type = UserLicenseType.MEDIA_LICENSE;

				userLicenseScope.byType(type);

				expect(userLicenseScope.query).toEqual({ type });
			});
		});
	});

	describe('byUserId', () => {
		describe('when userId is undefined', () => {
			it('should return scope without userId', () => {
				expect(userLicenseScope.byUserId()).toBe(userLicenseScope);
			});
		});

		describe('when userId is defined', () => {
			it('should add user to query', () => {
				const userId = 'userId';

				userLicenseScope.byUserId(userId);

				expect(userLicenseScope.query).toEqual({ user: userId });
			});
		});
	});
});
