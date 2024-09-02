import { AccountSave, AccountService } from '@modules/account';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { RoleReference, UserDO } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ExternalUserDto, OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';

@Injectable()
export class TspProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService
	) {
		super();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.TSP;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		// TODO EW-1004
		throw new Error('Method not implemented.');
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		const school = await this.findSchoolOrFail(data);
		const user = await this.provisionUserAndAccount(data, school);

		// TODO EW-999: Create or update classes

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private async findSchoolOrFail(data: OauthDataDto): Promise<School> {
		if (!data.externalSchool) {
			throw new Error('External school not given');
		}

		const school = await this.schoolService.getSchools({
			systemId: data.system.systemId,
			externalId: data.externalSchool.externalId,
		});

		if (!school || school.length === 0) {
			throw new Error('School not found');
		}

		return school[0];
	}

	private async provisionUserAndAccount(data: OauthDataDto, school: School): Promise<UserDO> {
		const existingUser = await this.userService.findByExternalId(data.externalUser.externalId, data.system.systemId);
		const roleRefs = await this.getRoleReferencesForUser(data.externalUser);

		let user: UserDO;
		if (existingUser) {
			// TODO EW-999: Check school change

			user = await this.updateUser(existingUser, data.externalUser, roleRefs, school.id);
		} else {
			user = await this.createUser(data.externalUser, roleRefs, school.id);
		}

		await this.ensureAccountExists(user, data.system.systemId);

		return user;
	}

	private async getRoleReferencesForUser(externalUser: ExternalUserDto): Promise<RoleReference[]> {
		if (!externalUser.roles) {
			return [];
		}

		const rolesDtos = await this.roleService.findByNames(externalUser.roles);
		const roleRefs = rolesDtos.map((role) => new RoleReference({ id: role.id || '', name: role.name }));

		return roleRefs;
	}

	private async updateUser(
		existingUser: UserDO,
		externalUser: ExternalUserDto,
		roleRefs: RoleReference[],
		schoolId: string
	): Promise<UserDO> {
		existingUser.roles = roleRefs;
		existingUser.schoolId = schoolId;
		existingUser.firstName = externalUser.firstName || existingUser.firstName;
		existingUser.lastName = externalUser.lastName || existingUser.lastName;
		existingUser.email = externalUser.email || existingUser.email;
		existingUser.birthday = externalUser.birthday;
		const updatedUser = await this.userService.save(existingUser);

		return updatedUser;
	}

	private async createUser(
		externalUser: ExternalUserDto,
		roleRefs: RoleReference[],
		schoolId: string
	): Promise<UserDO> {
		const newUser = new UserDO({
			roles: roleRefs,
			schoolId,
			firstName: externalUser.firstName || '',
			lastName: externalUser.lastName || '',
			email: externalUser.email || '',
			birthday: externalUser.birthday,
		});
		const savedUser = await this.userService.save(newUser);

		return savedUser;
	}

	private async ensureAccountExists(user: UserDO, systemId: string): Promise<void> {
		const account = await this.accountService.findByUserId(user.id || '');

		if (!account) {
			await this.accountService.saveWithValidation(
				new AccountSave({
					userId: user.id,
					username: user.email,
					systemId,
					activated: true,
				})
			);
		}
	}
}
