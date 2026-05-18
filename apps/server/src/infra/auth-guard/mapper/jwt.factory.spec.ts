import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { CreateJwtPayload } from '../interface';
import { JwtPayloadFactory } from './jwt.factory';

describe('JwtPayloadFactory', () => {
	describe('build', () => {
		it('should map current user to create jwt payload', () => {
			const currentUser = currentUserFactory.build();

			const createJwtPayload = new JwtPayloadFactory(currentUser).build();

			expect(createJwtPayload).toMatchObject<CreateJwtPayload>({
				accountId: currentUser.accountId,
				systemId: currentUser.systemId,
				roles: currentUser.roles,
				schoolId: currentUser.schoolId,
				userId: currentUser.userId,
				systemUser: false,
				support: false,
				isExternalUser: false,
			});
		});
	});

	describe('asSystemUser', () => {
		it('should map current user to create jwt payload with systemUser flag', () => {
			const currentUser = currentUserFactory.build();

			const createJwtPayload = new JwtPayloadFactory(currentUser).asSystemUser().build();

			expect(createJwtPayload).toMatchObject<CreateJwtPayload>({
				accountId: currentUser.accountId,
				systemId: currentUser.systemId,
				roles: currentUser.roles,
				schoolId: currentUser.schoolId,
				userId: currentUser.userId,
				systemUser: true,
				support: false,
				isExternalUser: false,
			});
		});
	});

	describe('asSupportUser', () => {
		it('should map current user to create jwt payload with support flag', () => {
			const currentUser = currentUserFactory.build();
			const supportUserId = new ObjectId().toHexString();

			const createJwtPayload = new JwtPayloadFactory(currentUser).asSupportUser(supportUserId).build();

			expect(createJwtPayload).toMatchObject<CreateJwtPayload>({
				accountId: currentUser.accountId,
				systemId: currentUser.systemId,
				roles: currentUser.roles,
				schoolId: currentUser.schoolId,
				userId: currentUser.userId,
				systemUser: false,
				support: true,
				supportUserId,
				isExternalUser: false,
			});
		});
	});
});
