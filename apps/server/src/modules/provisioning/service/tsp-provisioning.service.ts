import { AccountSave, AccountService } from '@modules/account';
import { ClassFactory, ClassService, ClassSourceOptions } from '@modules/class';
import { RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleReference, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { School, SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { ExternalClassDto, ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '../dto';
import { BadDataLoggableException } from '../strategy/loggable';

@Injectable()
export class TspProvisioningService {
	private ENTITY_SOURCE = 'tsp'; // used as source attribute in created users and classes

	constructor(
		private readonly schoolService: SchoolService,
		private readonly classService: ClassService,
		private readonly roleService: RoleService,
		private readonly userService: UserService,
		private readonly accountService: AccountService
	) {}

	public async findSchoolOrFail(system: ProvisioningSystemDto, school: ExternalSchoolDto): Promise<School> {
		const schools = await this.schoolService.getSchools({
			systemId: system.systemId,
			externalId: school.externalId,
		});

		if (schools.length !== 1) {
			throw new NotFoundLoggableException(School.name, {
				systemId: system.systemId,
				externalId: school.externalId,
			});
		}

		return schools[0];
	}

	public async provisionClasses(school: School, classes: ExternalClassDto[], user: UserDO): Promise<void> {
		if (!user.id) throw new BadDataLoggableException('User ID is missing', { user });

		for await (const clazz of classes) {
			const currentClass = await this.classService.findClassWithSchoolIdAndExternalId(school.id, clazz.externalId);

			if (currentClass) {
				// Case: Class exists -> update class
				currentClass.schoolId = school.id;
				if (clazz.name) {
					currentClass.name = clazz.name;
				}
				currentClass.year = school.currentYear?.id;
				currentClass.source = this.ENTITY_SOURCE;
				currentClass.sourceOptions = new ClassSourceOptions({ tspUid: clazz.externalId });

				if (user.roles.some((role) => role.name === RoleName.TEACHER)) currentClass.addTeacher(user.id);
				if (user.roles.some((role) => role.name === RoleName.STUDENT)) currentClass.addUser(user.id);

				await this.classService.save(currentClass);
			} else {
				// Case: Class does not exist yet -> create new class
				const newClass = ClassFactory.create({
					name: clazz.name,
					schoolId: school.id,
					year: school.currentYear?.id,
					teacherIds: user.roles.some((role) => role.name === RoleName.TEACHER) ? [user.id] : [],
					userIds: user.roles.some((role) => role.name === RoleName.STUDENT) ? [user.id] : [],
					source: this.ENTITY_SOURCE,
					sourceOptions: new ClassSourceOptions({ tspUid: clazz.externalId }),
				});

				await this.classService.save(newClass);
			}
		}
	}

	public async provisionUser(data: OauthDataDto, school: School): Promise<UserDO> {
		if (!data.externalSchool) throw new BadDataLoggableException('External school is missing', { data });

		const existingUser = await this.userService.findByExternalId(data.externalUser.externalId, data.system.systemId);
		const roleRefs = await this.getRoleReferencesForUser(data.externalUser);

		let user: UserDO;
		if (existingUser) {
			user = await this.updateUser(existingUser, data.externalUser, roleRefs, school.id);
		} else {
			user = await this.createUser(data.externalUser, roleRefs, school.id);
		}

		await this.createOrUpdateAccount(data.system.systemId, user);

		return user;
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
			throw new BadDataLoggableException('User firstname, lastname or email is missing', { externalUser });
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

	private async createOrUpdateAccount(systemId: string, user: UserDO): Promise<void> {
		if (!user.id) throw new BadDataLoggableException('user ID is missing', { user });

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

	private async getRoleReferencesForUser(externalUser: ExternalUserDto): Promise<RoleReference[]> {
		const rolesDtos = await this.roleService.findByNames(externalUser.roles || []);
		const roleRefs = rolesDtos.map((role) => new RoleReference({ id: role.id || '', name: role.name }));

		return roleRefs;
	}
}
