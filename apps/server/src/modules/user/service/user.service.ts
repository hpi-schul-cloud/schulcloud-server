import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { EntityId, LanguageType, PermissionService, Role, School, User } from '@shared/domain';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserConfig } from '@src/modules/user/interfaces';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
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

	async save(user: UserDto): Promise<void> {
		const userRoles: Role[] = await this.roleRepo.findByIds(user.roleIds);
		const school: School = await this.schoolRepo.findById(user.schoolId);

		if (user.id) {
			const userEntity: User = await this.userRepo.findById(user.id);
			const fromDto: User = UserMapper.mapFromDtoToEntity(user, userRoles, school);
			return this.userRepo.save(UserMapper.mapFromEntityToEntity(fromDto, userEntity));
		}

		return this.userRepo.save(UserMapper.mapFromDtoToEntity(user, userRoles, school));
	}
}
