import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, LanguageType, PermissionService, Role, User } from '@shared/domain';
import { RoleRepo, UserRepo } from '@shared/repo';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { ChangeLanguageParams } from '../controller/dto';
import { IUserConfig } from '../interfaces';

// TODO Refactoring https://ticketsystem.dbildungscloud.de/browse/N21-169 create service layer
@Injectable()
export class UserUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	private checkAvaibleLanguages(settedLanguage: LanguageType): void | Error {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(settedLanguage)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		this.checkAvaibleLanguages(params.language);
		const user = await this.userRepo.findById(userId);
		user.language = params.language;
		await this.userRepo.save(user);

		return true;
	}

	async save(user: UserDto): Promise<void> {
		const roleIds: EntityId[] = user.roles.filter((role) => role.id != null).map((role) => role.id as EntityId);
		const userRoles: Role[] = await this.roleRepo.findByIds(roleIds);

		if (user.id) {
			const userEntity = await this.userRepo.findById(user.id);
			const fromDto = UserMapper.mapFromDtoToEntity(user, userRoles);
			return this.userRepo.save(UserMapper.mapFromEntityToEntity(userEntity, fromDto));
		}

		return this.userRepo.save(UserMapper.mapFromDtoToEntity(user, userRoles));
	}
}
