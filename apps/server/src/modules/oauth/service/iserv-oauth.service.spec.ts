import { Collection } from '@mikro-orm/core';
import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, School, System, User } from '@shared/domain';
import { UserRepo } from '@shared/repo/user/user.repo';
import { ObjectId } from 'bson';
import { Logger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IservOAuthService } from './iserv-oauth.service';

describe('IservOAuthService', () => {
	let service: IservOAuthService;
	let userRepo: DeepMocked<UserRepo>;

	const defaultUserId = '123456789';
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
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();
		service = module.get(IservOAuthService);
		userRepo = module.get(UserRepo);
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
			userRepo.findByLdapIdOrFail.mockImplementation((ldapId: string): Promise<User> => {
				if (ldapId === '') {
					throw new OAuthSSOError();
				}
				return Promise.resolve(defaultUser);
			});
			const user = await service.findUserById(defaultUserId, defaultDecodedJWT);
			expect(userRepo.findByLdapIdOrFail).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});

		it('should return an error if no User is found by this ldapId', async () => {
			await expect(
				service.findUserById('', {
					uuid: '',
					sub: '',
				})
			).rejects.toEqual(new OAuthSSOError('Failed to find user with ldapId: unknown', 'sso_user_notfound'));
		});
	});
});
