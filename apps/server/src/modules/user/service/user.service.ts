import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, LanguageType, PermissionService, Role, School, User } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { RoleRepo, UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleService } from '@src/modules/role/service/role.service';
import { SchoolService } from '@src/modules/school';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { IUserConfig } from '../interfaces';
import { UserMapper } from '../mapper/user.mapper';
import { UserDto } from '../uc/dto/user.dto';

@Injectable()
export class UserService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly userDORepo: UserDORepo,
		private readonly roleRepo: RoleRepo,
		private readonly schoolMapper: SchoolMapper,
		private readonly schoolService: SchoolService,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>,
		private readonly roleService: RoleService
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	async getUser(id: string): Promise<UserDto> {
		const userEntity = await this.userRepo.findById(id, true);
		const userDto = UserMapper.mapFromEntityToDto(userEntity);
		return userDto;
	}

	async findById(id: string): Promise<UserDO> {
		const userDO = await this.userDORepo.findById(id, true);
		return userDO;
	}

	async save(user: UserDO): Promise<UserDO> {
		const savedUser: Promise<UserDO> = this.userDORepo.save(user);
		return savedUser;
	}

	async findByExternalId(externalId: string, systemId: EntityId): Promise<UserDO | null> {
		const user: Promise<UserDO | null> = this.userDORepo.findByExternalId(externalId, systemId);
		return user;
	}

	async findByEmail(email: string): Promise<User[]> {
		const user: Promise<User[]> = this.userRepo.findByEmail(email);
		return user;
	}

	async getDisplayName(userDto: UserDto): Promise<string> {
		const id: string = userDto.id ? userDto.id : '';

		const protectedRoles: RoleDto[] = await this.roleService.getProtectedRoles();
		const isProtectedUser = protectedRoles.find((role) => (userDto.roleIds || []).includes(role.id || ''));
		if (isProtectedUser) {
			return userDto.lastName ? userDto.lastName : id;
		}
		return userDto.lastName ? `${userDto.firstName} ${userDto.lastName}` : id;
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
		const schoolDO: SchoolDO = await this.schoolService.getSchoolById(user.schoolId);
		const schoolEntity: School = new School(this.schoolMapper.mapDOToEntityProperties(schoolDO));

		let saveEntity: User;
		if (user.id) {
			const userEntity: User = await this.userRepo.findById(user.id);
			const fromDto: User = UserMapper.mapFromDtoToEntity(user, userRoles, schoolEntity);
			saveEntity = UserMapper.mapFromEntityToEntity(fromDto, userEntity);
		} else {
			saveEntity = UserMapper.mapFromDtoToEntity(user, userRoles, schoolEntity);
		}

		const promise: Promise<void> = this.userRepo.save(saveEntity);
		return promise;
	}

	private checkAvailableLanguages(language: LanguageType): void | BadRequestException {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(language)) {
			throw new BadRequestException('Language is not activated.');
		}
	}
}
