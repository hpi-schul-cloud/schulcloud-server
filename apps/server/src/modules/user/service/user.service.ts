import { AccountService } from '@modules/account';
import { AccountDto } from '@modules/account/services/dto';
// invalid import
import { OauthCurrentUser } from '@modules/authentication/interface';
import { CurrentUserMapper } from '@modules/authentication/mapper';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { RoleService } from '@modules/role/service/role.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { Page, RoleReference, UserDO } from '@shared/domain/domainobject';
import { LanguageType, User } from '@shared/domain/entity';
import { DomainOperation, IFindOptions } from '@shared/domain/interface';
import { DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { Logger } from '@src/core/logger';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { UserConfig } from '../interfaces';
import { UserMapper } from '../mapper/user.mapper';
import { UserDto } from '../uc/dto/user.dto';
import { UserQuery } from './user-query.type';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly userDORepo: UserDORepo,
		private readonly configService: ConfigService<UserConfig, true>,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService,
		private readonly logger: Logger
	) {
		this.logger.setContext(UserService.name);
	}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = user.resolvePermissions();

		return [user, permissions];
	}

	/**
	 * @deprecated use {@link UserService.findById} instead
	 */
	async getUser(id: string): Promise<UserDto> {
		const userEntity = await this.userRepo.findById(id, true);
		const userDto = UserMapper.mapFromEntityToDto(userEntity);

		return userDto;
	}

	async getResolvedUser(userId: EntityId): Promise<OauthCurrentUser> {
		const user: UserDO = await this.findById(userId);
		const account: AccountDto = await this.accountService.findByUserIdOrFail(userId);

		const resolvedUser: OauthCurrentUser = CurrentUserMapper.mapToOauthCurrentUser(account.id, user, account.systemId);

		return resolvedUser;
	}

	async findById(id: string): Promise<UserDO> {
		const userDO = await this.userDORepo.findById(id, true);

		return userDO;
	}

	public async findByIdOrNull(id: string): Promise<UserDO | null> {
		const userDO: UserDO | null = await this.userDORepo.findByIdOrNull(id, true);

		return userDO;
	}

	async save(user: UserDO): Promise<UserDO> {
		const savedUser: Promise<UserDO> = this.userDORepo.save(user);

		return savedUser;
	}

	async saveAll(users: UserDO[]): Promise<UserDO[]> {
		const savedUsers: Promise<UserDO[]> = this.userDORepo.saveAll(users);

		return savedUsers;
	}

	async findUsers(query: UserQuery, options?: IFindOptions<UserDO>): Promise<Page<UserDO>> {
		const users: Page<UserDO> = await this.userDORepo.find(query, options);

		return users;
	}

	async findByExternalId(externalId: string, systemId: EntityId): Promise<UserDO | null> {
		const user: Promise<UserDO | null> = this.userDORepo.findByExternalId(externalId, systemId);

		return user;
	}

	async findByEmail(email: string): Promise<UserDO[]> {
		const user: Promise<UserDO[]> = this.userDORepo.findByEmail(email);

		return user;
	}

	async getDisplayName(user: UserDO): Promise<string> {
		const protectedRoles: RoleDto[] = await this.roleService.getProtectedRoles();
		const isProtectedUser: boolean = user.roles.some(
			(roleRef: RoleReference): boolean =>
				!!protectedRoles.find((protectedRole: RoleDto): boolean => roleRef.id === protectedRole.id)
		);

		const displayName: string = isProtectedUser ? user.lastName : `${user.firstName} ${user.lastName}`;

		return displayName;
	}

	async patchLanguage(userId: EntityId, newLanguage: LanguageType): Promise<boolean> {
		this.checkAvailableLanguages(newLanguage);
		const user = await this.userRepo.findById(userId);
		user.language = newLanguage;
		await this.userRepo.save(user);

		return true;
	}

	private checkAvailableLanguages(language: LanguageType): void | BadRequestException {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(language)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	async deleteUser(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable('Deleting user', DomainName.USER, userId, StatusModel.PENDING)
		);
		const response = await this.userRepo.deleteUser(userId);

		const deletedUsers = response !== null ? [response] : [];

		const numberOfDeletedUsers = deletedUsers.length;

		const result = DomainOperationBuilder.build(
			DomainName.USER,
			OperationType.DELETE,
			numberOfDeletedUsers,
			deletedUsers
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user',
				DomainName.USER,
				userId,
				StatusModel.FINISHED,
				0,
				numberOfDeletedUsers
			)
		);

		return result;
	}

	async getParentEmailsFromUser(userId: EntityId): Promise<string[]> {
		const parentEmails = this.userRepo.getParentEmailsFromUser(userId);

		return parentEmails;
	}

	public async findUserBySchoolAndName(schoolId: EntityId, firstName: string, lastName: string): Promise<User[]> {
		const users: User[] = await this.userRepo.findUserBySchoolAndName(schoolId, firstName, lastName);

		return users;
	}
}
