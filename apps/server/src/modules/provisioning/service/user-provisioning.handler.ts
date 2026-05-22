import { AccountSave, AccountService } from '@modules/account';
import { ErwinIdentifierService, ReferencedEntityType } from '@modules/erwin-identifier';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import crypto from 'node:crypto';
import { ExternalSchoolDto, ExternalUserDto, ProvisioningSystemDto } from '../dto';
import {
	BadDataLoggableException,
	SchoolMissingLoggableException,
	UserRoleUnknownLoggableException,
} from '../loggable';
import {
	ExternalEntityData,
	ProvisioningContext,
	ProvisioningEntityHandler,
	ProvisioningResult,
} from './erwin-provisioning-handler.interface';

@Injectable()
export class UserProvisioningHandler implements ProvisioningEntityHandler {
	public readonly referencedEntityType = ReferencedEntityType.USER;

	public readonly dtoName = ExternalUserDto.name;

	constructor(
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService,
		private readonly schoolService: SchoolService,
		private readonly erwinIdentifierService: ErwinIdentifierService
	) {}

	public validate(context: ProvisioningContext): void {
		if (!context.externalUser) {
			throw new BadDataLoggableException('ExternalUserDto is required for USER provisioning');
		}
		if (!context.externalSchool) {
			throw new BadDataLoggableException('ExternalSchoolDto is required for USER provisioning');
		}
	}

	public getExternalData(context: ProvisioningContext): ExternalEntityData {
		return context.externalUser as ExternalUserDto;
	}

	public getErwinId(context: ProvisioningContext): string | undefined {
		return context.externalUser?.erwinId;
	}

	public findByEntityId(entityId: string): Promise<ProvisioningResult | null> {
		return this.userService.findByIdOrNull(entityId);
	}

	public async findByExternalId(context: ProvisioningContext): Promise<UserDo | null> {
		const externalUser = context.externalUser as ExternalUserDto;

		const school = await this.findSchoolByExternalId(context);
		if (!school) {
			return null;
		}

		const user = await this.userService.findByExternalId(externalUser.externalId, context.system.systemId);

		if (user && user.schoolId === school.id) {
			return user;
		}

		return null;
	}

	public async create(context: ProvisioningContext): Promise<UserDo> {
		const externalUser = context.externalUser as ExternalUserDto;

		const school = await this.findSchoolByExternalId(context);
		if (!school) {
			throw new SchoolMissingLoggableException(externalUser);
		}

		const roleRefs = await this.createRoleReferences(externalUser.roles);
		if (!roleRefs?.length) {
			throw new UserRoleUnknownLoggableException(externalUser);
		}

		const user = new UserDo({
			externalId: externalUser.externalId,
			firstName: externalUser.firstName ?? '',
			preferredName: externalUser.preferredName,
			lastName: externalUser.lastName ?? '',
			email: externalUser.email ?? '',
			roles: roleRefs,
			schoolId: school.id,
			birthday: externalUser.birthday,
			secondarySchools: [],
		});

		const savedUser = await this.userService.save(user);

		await this.createAccount(savedUser, context.system);

		if (externalUser.erwinId) {
			await this.addErwinIdReference(savedUser.id as string, externalUser.erwinId);
		}

		return savedUser;
	}

	public async update(entity: ProvisioningResult, data: ExternalEntityData): Promise<UserDo> {
		const user = entity as UserDo;
		const externalUser = data as ExternalUserDto;

		if (externalUser.firstName) {
			user.firstName = externalUser.firstName;
		}

		if (externalUser.lastName) {
			user.lastName = externalUser.lastName;
		}

		if (externalUser.preferredName) {
			user.preferredName = externalUser.preferredName;
		}

		if (externalUser.email) {
			user.email = externalUser.email;
		}

		if (externalUser.birthday) {
			user.birthday = externalUser.birthday;
		}

		if (externalUser.roles?.length) {
			const roleRefs = await this.createRoleReferences(externalUser.roles);
			if (roleRefs?.length) {
				user.roles = roleRefs;
			}
		}

		return this.userService.save(user);
	}

	private async findSchoolByExternalId(context: ProvisioningContext): Promise<{ id: string } | null> {
		const externalSchool = context.externalSchool as ExternalSchoolDto;
		const schools = await this.schoolService.getSchools({
			systemId: context.system.systemId,
			externalId: externalSchool.externalId,
		});

		return schools.length > 0 ? schools[0] : null;
	}

	private async createAccount(user: UserDo, system: ProvisioningSystemDto): Promise<void> {
		await this.accountService.saveWithValidation({
			userId: user.id,
			username: crypto
				.createHash('sha256')
				.update(user.id as string)
				.digest('base64'),
			systemId: system.systemId,
			activated: true,
		} as AccountSave);
	}

	private async createRoleReferences(roles?: RoleName[]): Promise<RoleReference[] | undefined> {
		if (roles?.length) {
			const foundRoles = await this.roleService.findByNames(roles);
			const roleRefs = foundRoles.map(
				(role: RoleDto): RoleReference => new RoleReference({ id: role.id, name: role.name })
			);

			return roleRefs;
		}

		return undefined;
	}

	private async addErwinIdReference(userId: string, erwinId: string): Promise<void> {
		const existingIdentifier = await this.erwinIdentifierService.findByErwinId(erwinId);

		if (existingIdentifier) {
			return;
		}

		await this.erwinIdentifierService.createErwinIdentifier({
			erwinId,
			type: ReferencedEntityType.USER,
			referencedEntityId: userId,
		});
	}
}
