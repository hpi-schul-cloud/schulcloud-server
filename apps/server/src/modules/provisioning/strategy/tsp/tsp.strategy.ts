import { AccountSave, AccountService } from '@modules/account';
import { Class, ClassService } from '@modules/class';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable, NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleReference, UserDO } from '@shared/domain/domainobject';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ExternalUserDto, OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';
import { BadDataLoggableExceptions } from '../loggable';

@Injectable()
export class TspProvisioningStrategy extends ProvisioningStrategy {
	constructor(
		private readonly schoolService: SchoolService,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService,
		private readonly classService: ClassService
	) {
		super();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.TSP;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		// TODO EW-1004
		throw new NotImplementedException();
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		const school = await this.findSchoolOrFail(data);
		const user = await this.provisionUserAndAccount(data, school);

		// TODO EW-999: Create or update classes
		if (!user.id) throw new BadDataLoggableExceptions('User ID is missing', { user });
		if (!data.externalClasses) throw new BadDataLoggableExceptions('External classes are missing', { data });

		for await (const externalClass of data.externalClasses) {
			// TODO EW-999: Check if class exists
			const result = await this.classService.findClassWithSchoolIdAndExternalId(school.id, externalClass.externalId);
			if (result) {
				// TODO EW-999: Update class
			} else {
				// TODO EW-999: Create class
				const newClass = new Class({
					schoolId: school.id,
					externalId: externalClass.externalId,
					name: externalClass.name,
				});

				await this.classService.createMany([newClass]);
			}
		}

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private async findSchoolOrFail(data: OauthDataDto): Promise<School> {
		if (!data.externalSchool) throw new BadDataLoggableExceptions('External school is missing', { data });

		const school = await this.schoolService.getSchools({
			systemId: data.system.systemId,
			externalId: data.externalSchool.externalId,
		});

		if (!school || school.length === 0) {
			throw new NotFoundLoggableException(School.name, {
				systemId: data.system.systemId,
				externalId: data.externalSchool.externalId,
			});
		}

		return school[0];
	}

	private async provisionUserAndAccount(data: OauthDataDto, school: School): Promise<UserDO> {
		if (!data.externalSchool) throw new BadDataLoggableExceptions('External school is missing', { data });

		const existingUser = await this.userService.findByExternalId(data.externalUser.externalId, data.system.systemId);
		const roleRefs = await this.getRoleReferencesForUser(data.externalUser);

		let user: UserDO;
		if (existingUser && school.id === data.externalSchool?.externalId) {
			// Case: User exists and school is the same -> update user
			user = await this.updateUser(existingUser, data.externalUser, roleRefs, school.id);
		} else if (existingUser && school.id !== data.externalSchool?.externalId) {
			// Case: User exists but school is different -> school change and update user
			const schools = await this.schoolService.getSchools({
				systemId: data.system.systemId,
				externalId: data.externalSchool.externalId,
			});

			if (schools.length !== 1) {
				throw new NotFoundLoggableException(School.name, {
					systemId: data.system.systemId,
					externalId: data.externalSchool.externalId,
				});
			}

			const newSchool = schools[0];

			user = await this.updateUser(existingUser, data.externalUser, roleRefs, newSchool.id);
		} else {
			// Case: User does not exist yet -> create new user
			user = await this.createUser(data.externalUser, roleRefs, school.id);
		}

		await this.ensureAccountExists(user, data.system.systemId);

		return user;
	}

	private async getRoleReferencesForUser(externalUser: ExternalUserDto): Promise<RoleReference[]> {
		const rolesDtos = await this.roleService.findByNames(externalUser.roles || []);
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
		if (!externalUser.firstName || !externalUser.lastName || !externalUser.email) {
			throw new UnprocessableEntityException('Unable to create user without first name, last name or email');
		}

		const newUser = new UserDO({
			roles: roleRefs,
			schoolId,
			firstName: externalUser.firstName,
			lastName: externalUser.lastName,
			email: externalUser.email,
			birthday: externalUser.birthday,
		});
		const savedUser = await this.userService.save(newUser);

		return savedUser;
	}

	private async ensureAccountExists(user: UserDO, systemId: string): Promise<void> {
		if (!user.id) throw new BadDataLoggableExceptions('user ID is missing', { user });

		const account = await this.accountService.findByUserId(user.id);

		if (!account) {
			await this.accountService.saveWithValidation(
				new AccountSave({
					userId: user.id,
					username: user.email,
					systemId,
					activated: true,
				})
			);
		} else {
			account.username = user.email;
			await this.accountService.saveWithValidation(account);
		}
	}
}
