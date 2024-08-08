import { setupEntities } from '@shared/testing';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { currentUserFactory, jwtPayloadFactory } from '../testing';
import { CurrentUserMapper } from './current-user.mapper';

describe('CurrentUserMapper', () => {
	const accountId = 'mockAccountId';

	beforeAll(async () => {
		await setupEntities();
	});

	describe('jwtToICurrentUser', () => {
		describe('when JWT is provided with all claims', () => {
			const setup = () => {
				const mockJwtPayload = jwtPayloadFactory.build();

				return {
					mockJwtPayload,
				};
			};

			it('should return current user', () => {
				const { mockJwtPayload } = setup();

				const currentUser = CurrentUserMapper.jwtToICurrentUser(mockJwtPayload);

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

				const currentUser = CurrentUserMapper.jwtToICurrentUser(mockJwtPayload);

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

				const currentUser = CurrentUserMapper.jwtToICurrentUser(mockJwtPayload);

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

				const currentUser = CurrentUserMapper.jwtToICurrentUser(mockJwtPayload);

				expect(currentUser).toMatchObject({
					isExternalUser: true,
				});
			});
		});
	});

	describe('mapCurrentUserToCreateJwtPayload', () => {
		it('should map current user to create jwt payload', () => {
			const currentUser = currentUserFactory.build();

			const createJwtPayload: CreateJwtPayload = CurrentUserMapper.mapCurrentUserToCreateJwtPayload(currentUser);

			expect(createJwtPayload).toMatchObject<CreateJwtPayload>({
				accountId: currentUser.accountId,
				systemId: currentUser.systemId,
				roles: currentUser.roles,
				schoolId: currentUser.schoolId,
				userId: currentUser.userId,
				isExternalUser: false,
			});
		});
	});
});
