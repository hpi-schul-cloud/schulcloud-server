import { setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { ICurrentUser } from '../interface';
import { CurrentUserBuilder } from './current-user.factory';

describe('CurrentUserBuilder', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('build', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const accountId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const roles = [new ObjectId().toHexString()];

			const requiredProps = {
				userId,
				accountId,
				schoolId,
				roles,
			};

			return { requiredProps };
		};

		it('should be created with default values', () => {
			const { requiredProps } = setup();

			const currentUser = new CurrentUserBuilder(requiredProps).build();

			expect(currentUser).toMatchObject<ICurrentUser>({
				userId: requiredProps.userId,
				schoolId: requiredProps.schoolId,
				accountId: requiredProps.accountId,
				roles: requiredProps.roles,
				support: false,
				isExternalUser: false,
				systemId: undefined,
				externalIdToken: undefined,
			});
		});

		describe('when asUserSupporter is executed', () => {
			it('impersonated should be set true', () => {
				const { requiredProps } = setup();

				const currentUser = new CurrentUserBuilder(requiredProps).asUserSupporter(true).build();

				expect(currentUser).toMatchObject<ICurrentUser>({
					userId: requiredProps.userId,
					schoolId: requiredProps.schoolId,
					accountId: requiredProps.accountId,
					roles: requiredProps.roles,
					support: true,
					isExternalUser: false,
					systemId: undefined,
					externalIdToken: undefined,
				});
			});
		});

		describe('when asExternalUser is executed', () => {
			it('isExternalUser should be set true', () => {
				const { requiredProps } = setup();

				const currentUser = new CurrentUserBuilder(requiredProps).asExternalUser(true).build();

				expect(currentUser).toMatchObject<ICurrentUser>({
					userId: requiredProps.userId,
					schoolId: requiredProps.schoolId,
					accountId: requiredProps.accountId,
					roles: requiredProps.roles,
					support: false,
					isExternalUser: true,
					systemId: undefined,
					externalIdToken: undefined,
				});
			});
		});

		describe('when withExternalSystem is executed', () => {
			it('systemId should be set', () => {
				const { requiredProps } = setup();
				const systemId = new ObjectId().toHexString();

				const currentUser = new CurrentUserBuilder(requiredProps).withExternalSystem(systemId).build();

				expect(currentUser).toMatchObject<ICurrentUser>({
					userId: requiredProps.userId,
					schoolId: requiredProps.schoolId,
					accountId: requiredProps.accountId,
					roles: requiredProps.roles,
					support: false,
					isExternalUser: false,
					systemId,
					externalIdToken: undefined,
				});
			});
		});

		describe('when asExternalUserWithToken is executed', () => {
			it('isExternalUser and externalIdToken should be modified', () => {
				const { requiredProps } = setup();
				const externalIdToken = 'someRndToken';

				const currentUser = new CurrentUserBuilder(requiredProps).asExternalUserWithToken(externalIdToken).build();

				expect(currentUser).toMatchObject<ICurrentUser>({
					userId: requiredProps.userId,
					schoolId: requiredProps.schoolId,
					accountId: requiredProps.accountId,
					roles: requiredProps.roles,
					support: false,
					isExternalUser: true,
					systemId: undefined,
					externalIdToken,
				});
			});
		});
	});
});
