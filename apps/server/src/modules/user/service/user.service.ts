import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, LanguageType, PermissionService, Role, School, User } from '@shared/domain';
import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleService } from '@src/modules/role/service/role.service';
import { IUserConfig } from '@src/modules/user/interfaces';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserUcMapper } from '../mapper/user.uc.mapper';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
		private readonly roleService: RoleService,
		private readonly schoolRepo: SchoolRepo,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
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
		const school: School = await this.schoolRepo.findById(user.schoolId);

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

	async saveProvisioningUserOutputDto(user: ProvisioningUserOutputDto): Promise<void> {
		const roleDtos = await this.roleService.findByNames(user.roleNames);
		const roleIds: EntityId[] = roleDtos.map((role: RoleDto) => role.id as EntityId);
		return this.createOrUpdate(UserUcMapper.mapFromProvisioningUserOutputDtoToUserDto(user, roleIds));
	}
}
