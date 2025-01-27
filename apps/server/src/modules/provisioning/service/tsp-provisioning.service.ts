import { Account, AccountSave, AccountService } from '@modules/account';
import { ClassFactory, ClassService, ClassSourceOptions } from '@modules/class';
import { RoleService } from '@modules/role';
import { School, SchoolService } from '@modules/school';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
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

	public async provisionBatch(batch: OauthDataDto[]): Promise<void> {
		const schoolArrays = await Promise.all(
			batch.map((oauthData, index) =>
				this.schoolService.getSchools({
					systemId: batch[index].system.systemId,
					externalId: oauthData.externalSchool?.externalId,
				})
			)
		);

		const schoolIds = schoolArrays.map((schools, index) => {
			if (schools.length !== 1) {
				throw new NotFoundLoggableException(School.name, {
					systemId: batch[index].system.systemId,
					externalId: batch[index].externalSchool?.externalId ?? '',
				});
			}

			return schools[0].id;
		});

		const users = await Promise.all(
			batch.map((oauth) => this.userService.findByExternalId(oauth.externalUser.externalId, oauth.system.systemId))
		);

		const roleRefs = await Promise.all(
			batch.map((oauthDataDto) => this.getRoleReferencesForUser(oauthDataDto.externalUser))
		);

		const updatedUsers = users.map((user, index) => {
			const oauthDataDto = batch[index];
			return this.createOrUpdateUser(oauthDataDto.externalUser, roleRefs[index], schoolIds[index], user);
		});

		const savedUsers = await this.userService.saveAll(updatedUsers.filter((user) => user !== undefined));

		await Promise.all(
			batch.map((oauth, index) =>
				this.provisionClasses(
					schoolArrays[index][0],
					oauth.externalClasses ?? [],
					savedUsers.find((u) => u.id === oauth.externalUser.externalId)
				)
			)
		);

		const savedUserIds = savedUsers.map((savedUser) => savedUser.id);
		const accounts = await Promise.all(savedUserIds.map((userId) => this.accountService.findByUserId(userId ?? '')));

		const accountsToSave = accounts.map((account, index) =>
			this.createOrUpdateAccount(batch[index].system.systemId, savedUsers[index], account)
		);

		await this.accountService.saveAll(accountsToSave);
	}

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

	public async provisionClasses(school: School, classes: ExternalClassDto[], user: UserDO | undefined): Promise<void> {
		if (user === undefined) {
			return;
		}
		if (!user.id)
			throw new BadDataLoggableException('User ID is missing', {
				externalId: user.externalId,
			});

		for await (const clazz of classes) {
			const currentClass = await this.classService.findClassWithSchoolIdAndExternalId(school.id, clazz.externalId);

			if (currentClass) {
				// Case: Class exists -> update class
				currentClass.schoolId = school.id;
				currentClass.name = clazz.name ?? currentClass.name;
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
		if (!data.externalSchool) {
			throw new BadDataLoggableException('External school is missing for user', {
				externalId: data.externalUser.externalId,
			});
		}

		const existingUser = await this.userService.findByExternalId(data.externalUser.externalId, data.system.systemId);
		const roleRefs = await this.getRoleReferencesForUser(data.externalUser);

		const user = this.createOrUpdateUser(data.externalUser, roleRefs, school.id, existingUser);
		if (!user) {
			throw new BadDataLoggableException(); // TODO
		}
		await this.userService.save(user);

		const account = await this.accountService.findByUserId(user.id ?? '');
		const updated = this.createOrUpdateAccount(data.system.systemId, user, account);
		await this.accountService.save(updated);

		return user;
	}

	private createOrUpdateUser(
		externalUser: ExternalUserDto,
		roleRefs: RoleReference[],
		schoolId: string,
		existingUser?: UserDO | null
	): UserDO | undefined {
		if (!existingUser) {
			if (!externalUser.firstName || !externalUser.lastName) {
				// throw new BadDataLoggableException('User firstname or lastname is missing. TspUid:', {
				// 	externalId: externalUser.externalId,
				// });
				return undefined;
			}

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

			return newUser;
		}

		existingUser.roles = roleRefs;
		existingUser.schoolId = schoolId;
		existingUser.firstName = externalUser.firstName || existingUser.firstName;
		existingUser.lastName = externalUser.lastName || existingUser.lastName;
		existingUser.email = externalUser.email || existingUser.email;
		existingUser.birthday = externalUser.birthday;

		return existingUser;
	}

	private createOrUpdateAccount(systemId: string, user: UserDO, account: Account | null): AccountSave {
		if (!user.id) {
			throw new BadDataLoggableException('user ID is missing', {
				externalId: user.externalId,
			});
		}

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
