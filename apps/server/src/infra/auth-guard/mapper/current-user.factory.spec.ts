import { jwtPayloadFactory, setupEntities } from '@shared/testing';
import { CurrentUserFactory } from './current-user.factory';

describe('CurrentUserFactory', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('buildFromJwt', () => {
		describe('when JWT is provided with all claims', () => {
			const setup = () => {
				const mockJwtPayload = jwtPayloadFactory.build();

				return {
					mockJwtPayload,
				};
			};

			it('should return current user', () => {
				const { mockJwtPayload } = setup();

				const currentUser = CurrentUserFactory.buildFromJwt(mockJwtPayload);

				expect(currentUser).toMatchObject({
					accountId: mockJwtPayload.accountId,
					systemId: mockJwtPayload.systemId,
					roles: [mockJwtPayload.roles[0]],
					schoolId: mockJwtPayload.schoolId,
					userId: mockJwtPayload.userId,
					impersonated: mockJwtPayload.support,
				});
			});

			it('should return current user with default for isExternalUser', () => {
				const { mockJwtPayload } = setup();

				const currentUser = CurrentUserFactory.buildFromJwt(mockJwtPayload);

				expect(currentUser).toMatchObject({
					isExternalUser: mockJwtPayload.isExternalUser,
				});
			});
		});

		describe('when JWT is provided without optional claims', () => {
			const setup = () => {
				const mockJwtPayload = jwtPayloadFactory.build();

				return {
					mockJwtPayload,
				};
			};

			it('should return current user', () => {
				const { mockJwtPayload } = setup();

				const currentUser = CurrentUserFactory.buildFromJwt(mockJwtPayload);

				expect(currentUser).toMatchObject({
					accountId: mockJwtPayload.accountId,
					roles: [mockJwtPayload.roles[0]],
					schoolId: mockJwtPayload.schoolId,
					userId: mockJwtPayload.userId,
					isExternalUser: true,
				});
			});

			it('should return current user with default for isExternalUser', () => {
				const { mockJwtPayload } = setup();

				const currentUser = CurrentUserFactory.buildFromJwt(mockJwtPayload);

				expect(currentUser).toMatchObject({
					isExternalUser: true,
				});
			});
		});
	});
});
