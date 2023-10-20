import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, IFindOptions, LanguageType, User } from '@shared/domain';
import { RoleReference } from '@shared/domain/domainobject';
import { Page } from '@shared/domain/domainobject/page';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { ICurrentUser } from '@src/modules/authentication';
import { CurrentUserMapper } from '@src/modules/authentication/mapper';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleService } from '@src/modules/role/service/role.service';
import { IUserConfig } from '../interfaces';
import { UserMapper } from '../mapper/user.mapper';
import { UserDto } from '../uc/dto/user.dto';
import { UserQuery } from './user-query.type';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly userDORepo: UserDORepo,
		private readonly configService: ConfigService<IUserConfig, true>,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = user.resolvePermissions();

		return [user, permissions];
	}

	/**
	 * @deprecated
	 */
	async getUser(id: string): Promise<UserDto> {
		const userEntity = await this.userRepo.findById(id, true);
		const userDto = UserMapper.mapFromEntityToDto(userEntity);
		return userDto;
	}

	async getResolvedUser(userId: EntityId): Promise<ICurrentUser> {
		const user: User = await this.userRepo.findById(userId, true);
		const account: AccountDto = await this.accountService.findByUserIdOrFail(userId);

		const resolvedUser: ICurrentUser = CurrentUserMapper.userToICurrentUser(account.id, user, account.systemId);
		return resolvedUser;
	}

	async findById(id: string): Promise<UserDO> {
		const userDO = await this.userDORepo.findById(id, true);
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

	async findByEmail(email: string): Promise<User[]> {
		const user: Promise<User[]> = this.userRepo.findByEmail(email);
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
}
