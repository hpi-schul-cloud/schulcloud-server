import { currentUserFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { CreateJwtPayload } from '../interface';
import { JwtPayloadFactory } from './jwt.factory';

describe('JwtPayloadFactory', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('buildFromCurrentUser', () => {
		it('should map current user to create jwt payload', () => {
			const currentUser = currentUserFactory.build();

			const createJwtPayload = JwtPayloadFactory.buildFromCurrentUser(currentUser);

			expect(createJwtPayload).toMatchObject<CreateJwtPayload>({
				accountId: currentUser.accountId,
				systemId: currentUser.systemId,
				roles: currentUser.roles,
				schoolId: currentUser.schoolId,
				userId: currentUser.userId,
				support: false,
				isExternalUser: false,
			});
		});
	});

	describe('buildFromSupportUser', () => {
		it('should map current user to create jwt payload', () => {
			const currentUser = currentUserFactory.build();
			const supportUserId = new ObjectId().toHexString();

			const createJwtPayload = JwtPayloadFactory.buildFromSupportUser(currentUser, supportUserId);

			expect(createJwtPayload).toMatchObject<CreateJwtPayload>({
				accountId: currentUser.accountId,
				systemId: currentUser.systemId,
				roles: currentUser.roles,
				schoolId: currentUser.schoolId,
				userId: currentUser.userId,
				support: true,
				supportUserId,
				isExternalUser: false,
			});
		});
	});
});
