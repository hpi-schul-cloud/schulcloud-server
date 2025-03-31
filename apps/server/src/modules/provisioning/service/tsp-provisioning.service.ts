import { TspUserInfo } from '@infra/sync/strategy/tsp/';
import { Account, AccountSave, AccountService } from '@modules/account';
import { Class, ClassFactory, ClassService, ClassSourceOptions } from '@modules/class';
import { RoleName, RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { Consent, ParentConsent, UserConsent, UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleReference } from '@shared/domain/domainobject';
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

	public async provisionUserBatch(oauthDataDtos: OauthDataDto[], schools: Map<string, School>): Promise<number> {
		const users = await Promise.all(
			oauthDataDtos.map((oauth) =>
				this.userService.findByExternalId(oauth.externalUser.externalId, oauth.system.systemId)
			)
		);

		const roleRefs = await Promise.all(
			oauthDataDtos.map((oauthDataDto) => this.getRoleReferencesForUser(oauthDataDto.externalUser))
		);

		const updatedUsers = users.map((user, index) => {
			const oauthDataDto = oauthDataDtos[index];
			const school = schools.get(oauthDataDto.externalSchool?.externalId ?? '');
			if (!school) {
				throw new NotFoundLoggableException('school', {
					externalId: oauthDataDto.externalSchool?.externalId ?? '',
				});
			}
			return this.createOrUpdateUser(oauthDataDto.externalUser, roleRefs[index], school.id, user);
		});

		// Has to be done two times otherwise user.consent.parentConsents is empty
		await this.userService.saveAll(updatedUsers.filter((user) => user !== undefined));
		const savedUsers = await this.userService.saveAll(updatedUsers.filter((user) => user !== undefined));

		const savedUserIds = savedUsers.map((savedUser) => savedUser.id);
		const foundAccounts = await Promise.all(
			savedUserIds.map((userId) => this.accountService.findByUserId(userId ?? ''))
		);

		const accountsToSave = foundAccounts.map((account, index) =>
			this.createOrUpdateAccount(oauthDataDtos[index].system.systemId, savedUsers[index], account)
		);

		const savedAccounts = await this.accountService.saveAll(accountsToSave);

		return savedAccounts.length;
	}

	public async provisionClassBatch(
		school: School,
		externalClasses: ExternalClassDto[],
		usersOfClasses: Map<string, TspUserInfo[]>,
		fullSync: boolean
	): Promise<{ classUpdateCount: number; classCreationCount: number }> {
		const classes = await this.classService.findClassesForSchool(school.id);

		let classUpdateCount = 0;
		let classCreationCount = 0;
		const classesToSave: Class[] = [];
		for await (const externalClass of externalClasses) {
			const currentClass = classes.find((clazz) => clazz.sourceOptions?.tspUid === externalClass.externalId);

			const tspUserInfos = usersOfClasses.get(externalClass.externalId) ?? [];
			const teacherExternalIds = tspUserInfos
				.filter((userInfo) => userInfo.role === RoleName.TEACHER)
				.map((userInfo) => userInfo.externalId);
			const studentExternalIds = tspUserInfos
				.filter((userInfo) => userInfo.role === RoleName.STUDENT)
				.map((userInfo) => userInfo.externalId);

			const [teacherIds, studentIds] = await Promise.all([
				this.userService.findMultipleByExternalIds(teacherExternalIds),
				this.userService.findMultipleByExternalIds(studentExternalIds),
			]);

			if (currentClass) {
				classesToSave.push(this.updateClass(currentClass, externalClass, school, teacherIds, studentIds, fullSync));
				classUpdateCount += 1;
			} else {
				classesToSave.push(this.createClass(externalClass, school, teacherIds, studentIds));
				classCreationCount += 1;
			}
		}
		if (classesToSave.length > 0) {
			await this.classService.save(classesToSave);
		}

		return { classUpdateCount, classCreationCount };
	}

	public async findSchoolOrFail(system: ProvisioningSystemDto, school: ExternalSchoolDto): Promise<School> {
		const schools = await this.schoolService.getSchools({ systemId: system.systemId, externalId: school.externalId });

		if (schools.length !== 1) {
			throw new NotFoundLoggableException(School.name, { systemId: system.systemId, externalId: school.externalId });
		}

		return schools[0];
	}

	public async provisionClasses(school: School, classes: ExternalClassDto[], user: UserDo): Promise<void> {
		TypeGuard.requireKeys(
			user,
			['id'],
			new BadDataLoggableException('User ID is missing', { externalId: user.externalId })
		);

		const promises = classes.map(async (clazz) => {
			const currentClass = await this.classService.findClassWithSchoolIdAndExternalId(school.id, clazz.externalId);

			const teacherIds: string[] = user.roles.some((role) => role.name === RoleName.TEACHER) ? [user.id] : [];
			const studentIds: string[] = user.roles.some((role) => role.name === RoleName.STUDENT) ? [user.id] : [];

			let classToSave: Class;
			if (currentClass) {
				classToSave = this.updateClass(currentClass, clazz, school, teacherIds, studentIds, false);
			} else {
				classToSave = this.createClass(clazz, school, teacherIds, studentIds);
			}
			await this.classService.save(classToSave);
		});

		await Promise.all(promises);
	}

	private updateClass(
		currentClass: Class,
		clazz: ExternalClassDto,
		school: School,
		teacherIds: string[],
		studentIds: string[],
		clearParticipants: boolean
	): Class {
		currentClass.schoolId = school.id;
		currentClass.name = clazz.name ?? currentClass.name;
		currentClass.gradeLevel = clazz.gradeLevel ?? currentClass.gradeLevel;
		currentClass.year = school.currentYear?.id;
		currentClass.source = this.ENTITY_SOURCE;
		currentClass.sourceOptions = new ClassSourceOptions({ tspUid: clazz.externalId });

		if (clearParticipants) {
			currentClass.clearParticipants();
		}

		teacherIds.forEach((teacherId) => currentClass.addTeacher(teacherId));
		studentIds.forEach((studentId) => currentClass.addUser(studentId));

		return currentClass;
	}

	private createClass(clazz: ExternalClassDto, school: School, teacherIds: string[], studentIds: string[]): Class {
		const newClass = ClassFactory.create({
			name: clazz.name,
			gradeLevel: clazz.gradeLevel,
			schoolId: school.id,
			year: school.currentYear?.id,
			teacherIds,
			userIds: studentIds,
			source: this.ENTITY_SOURCE,
			sourceOptions: new ClassSourceOptions({ tspUid: clazz.externalId }),
		});

		return newClass;
	}

	public async provisionUser(data: OauthDataDto, school: School): Promise<UserDo> {
		TypeGuard.requireKeys(
			data,
			['externalSchool'],
			new BadDataLoggableException('External school is missing for user', { externalId: data.externalUser.externalId })
		);

		const existingUser = await this.userService.findByExternalId(data.externalUser.externalId, data.system.systemId);
		const roleRefs = await this.getRoleReferencesForUser(data.externalUser);

		const user = this.createOrUpdateUser(data.externalUser, roleRefs, school.id, existingUser);
		if (!user) {
			throw new BadDataLoggableException(`Couldn't process user`, { externalId: data.externalUser.externalId });
		}

		// Has to be done two times otherwise user.consent.parentConsents is empty
		await this.userService.save(user);
		const savedUser = await this.userService.save(user);

		try {
			const account = await this.accountService.findByUserId(savedUser.id ?? '');
			const updated = this.createOrUpdateAccount(data.system.systemId, savedUser, account);
			await this.accountService.save(updated);
		} catch (error) {
			if (existingUser === null) {
				await this.userService.deleteUser(savedUser.id ?? '');
			}
			throw new BadDataLoggableException('Error while saving account', { externalId: data.externalUser.externalId });
		}

		return user;
	}

	private createOrUpdateUser(
		externalUser: ExternalUserDto,
		roleRefs: RoleReference[],
		schoolId: string,
		existingUser?: UserDo | null
	): UserDo | undefined {
		if (!existingUser) {
			if (!externalUser.firstName || !externalUser.lastName) {
				return undefined;
			}

			const newUser = new UserDo({
				roles: roleRefs,
				schoolId,
				firstName: externalUser.firstName,
				lastName: externalUser.lastName,
				email: this.createTspEmail(externalUser.externalId),
				birthday: new Date(),
				externalId: externalUser.externalId,
				secondarySchools: [],
				lastSyncedAt: new Date(),
				consent: this.createTspConsent(),
				source: this.ENTITY_SOURCE,
			});

			return newUser;
		}

		existingUser.roles = roleRefs;
		existingUser.schoolId = schoolId;
		existingUser.firstName = externalUser.firstName || existingUser.firstName;
		existingUser.lastName = externalUser.lastName || existingUser.lastName;
		existingUser.email = externalUser.email || existingUser.email;
		existingUser.birthday = externalUser.birthday || existingUser.birthday || new Date();
		existingUser.lastSyncedAt = new Date();
		existingUser.source = existingUser.source || this.ENTITY_SOURCE;

		if (!existingUser.consent || !existingUser.consent.parentConsents?.length || !existingUser.consent.userConsent) {
			existingUser.consent = this.createTspConsent();
		}

		return existingUser;
	}

	private createOrUpdateAccount(systemId: string, user: UserDo, account: Account | null): AccountSave {
		TypeGuard.requireKeys(
			user,
			['id'],
			new BadDataLoggableException('user ID is missing', { externalId: user.externalId })
		);

		if (account) {
			const updated = new AccountSave({
				userId: user.id,
				username: user.email,
				activated: true,
				systemId: account.systemId,
				id: account.id,
			});

			return updated;
		}

		const newAccount = new AccountSave({
			userId: user.id,
			username: user.email,
			systemId,
			activated: true,
		});

		return newAccount;
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

	private createTspConsent(): Consent {
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
			parentConsents: [parentConsent],
		});

		return consent;
	}
}
