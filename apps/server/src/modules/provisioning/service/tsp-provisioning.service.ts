import { AccountSave, AccountService } from '@modules/account';
import { Class, ClassFactory, ClassService, ClassSourceOptions } from '@modules/class';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleReference, UserDO } from '@shared/domain/domainobject';
import { Consent } from '@shared/domain/domainobject/consent';
import { ParentConsent } from '@shared/domain/domainobject/parent-consent';
import { UserConsent } from '@shared/domain/domainobject/user-consent';
import { RoleName } from '@shared/domain/interface';
import { ObjectId } from 'bson';
import { ExternalClassDto, ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '../dto';
import { BadDataLoggableException } from '../loggable';

@Injectable()
export class TspProvisioningService {
	private ENTITY_SOURCE = 'tsp'; // used as source attribute in created users and classes

	private TSP_EMAIL_DOMAIN = 'schul-cloud.org';

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
		const promises = classes.map(async (clazz) => {
			const currentClass = await this.classService.findClassWithSchoolIdAndExternalId(school.id, clazz.externalId);

			if (currentClass) {
				await this.updateClass(currentClass, clazz, school, user);
			} else {
				await this.createClass(clazz, school, user);
			}
		});

		await Promise.all(promises);
	}

	private async updateClass(currentClass: Class, clazz: ExternalClassDto, school: School, user: UserDO): Promise<void> {
		TypeGuard.requireKeys(
			user,
			['id'],
			new BadDataLoggableException('User ID is missing', { externalId: user.externalId })
		);

		currentClass.schoolId = school.id;
		currentClass.name = clazz.name ?? currentClass.name;
		currentClass.year = school.currentYear?.id;
		currentClass.source = this.ENTITY_SOURCE;
		currentClass.sourceOptions = new ClassSourceOptions({ tspUid: clazz.externalId });

		if (user.roles.some((role) => role.name === RoleName.TEACHER)) {
			currentClass.addTeacher(user.id);
		}
		if (user.roles.some((role) => role.name === RoleName.STUDENT)) {
			currentClass.addUser(user.id);
		}

		await this.classService.save(currentClass);
	}

	private async createClass(clazz: ExternalClassDto, school: School, user: UserDO): Promise<void> {
		TypeGuard.requireKeys(
			user,
			['id'],
			new BadDataLoggableException('User ID is missing', { externalId: user.externalId })
		);

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

	public async provisionUser(data: OauthDataDto, school: School): Promise<UserDO> {
		TypeGuard.requireKeys(
			data,
			['externalSchool'],
			new BadDataLoggableException('External school is missing for user', { externalId: data.externalUser.externalId })
		);

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
		TypeGuard.requireKeys(
			externalUser,
			['firstName', 'lastName'],
			new BadDataLoggableException('User firstname or lastname is missing', { externalId: externalUser.externalId })
		);

		const newUser = new UserDO({
			roles: roleRefs,
			schoolId,
			firstName: externalUser.firstName,
			lastName: externalUser.lastName,
			email: this.createTspEmail(externalUser.externalId),
			birthday: externalUser.birthday,
			externalId: externalUser.externalId,
			secondarySchools: [],
		});

		this.createTspConsent(newUser);

		const savedUser = await this.userService.save(newUser);

		return savedUser;
	}

	private async createOrUpdateAccount(systemId: string, user: UserDO): Promise<void> {
		TypeGuard.requireKeys(
			user,
			['id'],
			new BadDataLoggableException('User ID is missing', { externalId: user.externalId })
		);

		const account = await this.accountService.findByUserId(user.id);

		if (account) {
			// Updates account with new systemId and username
			await account.update(new AccountSave({ userId: user.id, systemId, username: user.email, activated: true }));
			await this.accountService.save(account);
		} else {
			// Creates new account for user
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

	private async getRoleReferencesForUser(externalUser: ExternalUserDto): Promise<RoleReference[]> {
		const rolesDtos = await this.roleService.findByNames(externalUser.roles || []);
		const roleRefs = rolesDtos.map((role) => new RoleReference({ id: role.id || '', name: role.name }));

		return roleRefs;
	}

	private createTspEmail(externalId: string): string {
		const email = `${externalId}@${this.TSP_EMAIL_DOMAIN}`;

		return email.toLowerCase();
	}

	private createTspConsent(user: UserDO): void {
		const userConsent = new UserConsent({
			form: 'digital',
			privacyConsent: true,
			termsOfUseConsent: true,
			dateOfPrivacyConsent: new Date(),
			dateOfTermsOfUseConsent: new Date(),
		});

		const parentConsent = new ParentConsent({
			id: new ObjectId().toString(),
			form: 'digital',
			privacyConsent: true,
			termsOfUseConsent: true,
			dateOfPrivacyConsent: new Date(),
			dateOfTermsOfUseConsent: new Date(),
		});

		const consent = new Consent({
			userConsent,
			parentConsent: [parentConsent],
		});

		user.consent = consent;
	}
}
