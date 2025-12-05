import { MailService } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountSave, AccountService } from '@modules/account';
import { RoleName, RoleService } from '@modules/role';
import { SchoolService } from '@modules/school';
import { SchoolPurpose } from '@modules/school/domain';
import { Consent, UserConsent, UserDo, UserService } from '@modules/user';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { LanguageType } from '@shared/domain/interface';
import { UUID } from 'bson';
import { isDisposableEmail as _isDisposableEmail } from 'disposable-email-domains-js';
import { RegistrationRepo } from '../../repo';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';

@Injectable()
export class RegistrationService {
	constructor(
		private readonly registrationRepo: RegistrationRepo,
		private readonly roleService: RoleService,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly schoolService: SchoolService,
		private readonly mailService: MailService
	) {}

	public async createOrUpdateRegistration(props: RegistrationCreateProps): Promise<Registration> {
		const existingRegistration = await this.getSingleRegistrationByEmail(props.email);

		const registration = existingRegistration
			? await this.updateRegistration(existingRegistration, props)
			: await this.createRegistraton({ ...props });

		return registration;
	}

	public async completeRegistration(
		registration: Registration,
		language: LanguageType,
		password: string
	): Promise<void> {
		const userDo = await this.createUser(registration, language);
		if (userDo) {
			const user = await this.userService.save(userDo);
			const account = this.createAccount(user, password);
			if (account) {
				await this.accountService.save(account);
			}
		}
	}

	public async saveRegistration(registration: Registration): Promise<void> {
		await this.registrationRepo.save(registration);
	}

	public async getSingleRegistrationByEmail(email: string): Promise<Registration | null> {
		const registrationResult = await this.registrationRepo.findByEmail(email);

		return registrationResult;
	}

	public async getSingleRegistrationBySecret(registrationSecret: string): Promise<Registration> {
		const registration = await this.registrationRepo.findBySecret(registrationSecret);

		return registration;
	}

	public async getRegistrationsByRoomId(roomId: string): Promise<Registration[]> {
		const registrations = await this.registrationRepo.findByRoomId(roomId);

		return registrations;
	}

	public async sendRegistrationMail(registration: Registration): Promise<void> {
		const registrationMail = registration.generateRegistrationMail();
		await this.mailService.send(registrationMail);
	}

	private createRegistrationUUID(): string {
		const registrationUUID = new UUID().toString();

		return registrationUUID;
	}

	private blockForbiddenDomains(email: string): void {
		const isBlockedDomain = _isDisposableEmail(email);
		if (isBlockedDomain) {
			throw new BadRequestException('Registration using disposable email domains is not allowed.');
		}
	}

	private async updateRegistration(
		existingRegistration: Registration,
		props: RegistrationCreateProps
	): Promise<Registration> {
		existingRegistration.firstName = props.firstName;
		existingRegistration.lastName = props.lastName;
		existingRegistration.addRoomId(props.roomId);
		await this.saveRegistration(existingRegistration);
		return existingRegistration;
	}

	private async createRegistraton(props: RegistrationCreateProps): Promise<Registration> {
		this.blockForbiddenDomains(props.email);

		const registrationProps: RegistrationProps = {
			...props,
			id: new ObjectId().toHexString(),
			registrationSecret: this.createRegistrationUUID(),
			roomIds: [props.roomId],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const registration = new Registration(registrationProps);

		await this.registrationRepo.save(registration);

		return registration;
	}

	private async createUser(registration: Registration, language: LanguageType): Promise<UserDo | undefined> {
		if (!registration.firstName || !registration.lastName) {
			return undefined;
		}
		const externalPersonRole = await this.roleService.findByName(RoleName.EXTERNALPERSON);
		if (externalPersonRole === null) {
			throw new Error('ExternalPerson role not found');
		}
		const roleRefs = [new RoleReference({ id: externalPersonRole.id, name: externalPersonRole.name })];

		const externalPersonsSchools = await this.schoolService.getSchools({
			purpose: SchoolPurpose.EXTERNAL_PERSON_SCHOOL,
		});
		if (externalPersonsSchools === undefined || externalPersonsSchools.length > 1) {
			throw new Error('Number of externalPersonSchools in system is not valid - should be 1');
		}
		const schoolId = externalPersonsSchools[0].id;

		const newUser = new UserDo({
			roles: roleRefs,
			schoolId,
			firstName: registration.firstName,
			lastName: registration.lastName,
			email: registration.email,
			birthday: new Date('2000-01-01'),
			secondarySchools: [],
			consent: this.createUserConsent(),
			forcePasswordChange: false,
			preferences: {
				firstLogin: false,
			},
			language,
		});

		return newUser;
	}

	private createAccount(user: UserDo, password: string): AccountSave {
		const newAccount = new AccountSave({
			userId: user.id,
			username: user.email,
			activated: true,
			password,
		});

		return newAccount;
	}

	private createUserConsent(): Consent {
		const userConsent = new UserConsent({
			form: 'digital',
			privacyConsent: true,
			termsOfUseConsent: true,
			dateOfPrivacyConsent: new Date(),
			dateOfTermsOfUseConsent: new Date(),
		});

		const consent = new Consent({
			userConsent,
		});

		return consent;
	}
}
