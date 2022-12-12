import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { EntityId, LanguageType, PermissionService, Role, School, User } from '@shared/domain';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserConfig } from '@src/modules/user/interfaces';
import { RoleService } from '@src/modules/role/service/role.service';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { SchoolDO } from '@shared/domain/domainobject/school.do';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
		private readonly schoolRepo: SchoolRepo,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>,
		private readonly roleService: RoleService
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	/**
	 * Gets a user based on their id.
	 *
	 * @param id
	 * @return {@link UserDto}
	 */
	async getUser(id: string): Promise<UserDto> {
		const userEntity = await this.userRepo.findById(id, true);
		const userDto = UserMapper.mapFromEntityToDto(userEntity);
		return userDto;
	}

	/**
	 * Gets the display name of an user.
	 *
	 * For this, it is checked which role he has.
	 *
	 * @param userDto
	 * @return concatenated string
	 */
	async getDisplayName(userDto: UserDto): Promise<string> {
		const id: string = userDto.id ? userDto.id : '';

		const protectedRoles: RoleDto[] = await this.roleService.getProtectedRoles();
		const isProtectedUser = protectedRoles.find((role) => (userDto.roleIds || []).includes(role.id || ''));
		if (isProtectedUser) {
			return userDto.lastName ? userDto.lastName : id;
		}
		return userDto.lastName ? `${userDto.firstName} ${userDto.lastName}` : id;
	}

	private checkAvailableLanguages(language: LanguageType): void | BadRequestException {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(language)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	async patchLanguage(userId: EntityId, newLanguage: LanguageType): Promise<boolean> {
		this.checkAvailableLanguages(newLanguage);
		const user = await this.userRepo.findById(userId);
		user.language = newLanguage;
		await this.userRepo.save(user);

		return true;
	}

	async createOrUpdate(user: UserDto): Promise<void> {
		const userRoles: Role[] = await this.roleRepo.findByIds(user.roleIds);
		const school: SchoolDO = await this.schoolRepo.findById(user.schoolId);

		let saveEntity: User;
		if (user.id) {
			const userEntity: User = await this.userRepo.findById(user.id);
			const fromDto: User = UserMapper.mapFromDtoToEntity(user, userRoles, school);
			saveEntity = UserMapper.mapFromEntityToEntity(fromDto, userEntity);
		} else {
			saveEntity = UserMapper.mapFromDtoToEntity(user, userRoles, school);
		}

		const promise: Promise<void> = this.userRepo.save(saveEntity);
		return promise;
	}
}
