import { Collection } from '@mikro-orm/core';
import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, School, System, User } from '@shared/domain';
import { UserRepo } from '@shared/repo/user/user.repo';
import { ObjectId } from 'bson';
import { Logger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IservOAuthService } from './iserv-oauth.service';

describe('IservOAuthService', () => {
	let service: IservOAuthService;
	let userRepo: UserRepo;

	const defaultUserId = '123456789';
	const defaultSystemId = '987654321';
	const defaultScool: School = {
		name: '',
		_id: new ObjectId(),
		id: '',
		systems: new Collection<System>([]),
	};
	const defaultUser: User = {
		email: '',
		roles: new Collection<Role>([]),
		school: defaultScool,
		_id: new ObjectId(),
		id: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		ldapId: '1111',
		firstName: '',
		lastName: '',
	};
	const defaultDecodedJWT = {
		sub: '',
		uuid: '1111',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				IservOAuthService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: UserRepo,
					useValue: {
						findByLdapIdorFail(userId, systemId) {
							if (userId === '') throw new OAuthSSOError();
							return defaultUser;
						},
					},
				},
			],
		}).compile();
		service = await module.resolve<IservOAuthService>(IservOAuthService);

		userRepo = await module.resolve<UserRepo>(UserRepo);
	});

	describe('extractUUID', () => {
		it('should get uuid from id_token', () => {
			const uuid: string = service.extractUUID({
				uuid: '123',
				sub: '',
			});
			expect(uuid).toStrictEqual('123');
		});

		it('should throw an error for id_token that does not exist an uuid', () => {
			expect(() => {
				const uuid: string = service.extractUUID({
					uuid: '',
					sub: '',
				});
				return uuid;
			}).toThrow(OAuthSSOError);
		});
	});

	describe('findUserById', () => {
		it('should return the user according to the uuid(LdapId)', async () => {
			const resolveUserSpy = jest.spyOn(userRepo, 'findByLdapIdorFail');
			const user: User = await service.findUserById(defaultUserId, defaultDecodedJWT);
			expect(resolveUserSpy).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});

		it('should return an error if no User is found by this ldapId', async () => {
			return expect(
				service.findUserById('', {
					uuid: '',
					sub: '',
				})
			).rejects.toEqual(new OAuthSSOError('Failed to find user with this ldapId', 'sso_user_notfound'));
		});
	});
});
