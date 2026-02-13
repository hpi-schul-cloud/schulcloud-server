import { Logger } from '@core/logger';
import { MailService } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountSave, AccountService } from '@modules/account';
import { REGISTRATION_CONFIG_TOKEN, RegistrationConfig } from '@modules/registration/registration.config';
import { RoleName, RoleService } from '@modules/role';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { SchoolPurpose } from '@modules/school/domain';
import { Consent, UserConsent, UserDo, UserService } from '@modules/user';
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { LanguageType } from '@shared/domain/interface';
import { UUID } from 'bson';
import { isDisposableEmail as _isDisposableEmail } from 'disposable-email-domains-js';
import { RegistrationRepo } from '../../repo';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';
import { ResendingRegistrationMailLoggable } from '../error/resend-registration-mail.loggable';

@Injectable()
export class RegistrationService {
	constructor(
		private readonly registrationRepo: RegistrationRepo,
		private readonly roleService: RoleService,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly schoolService: SchoolService,
		private readonly mailService: MailService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomService: RoomService,
		private readonly logger: Logger,
		@Inject(REGISTRATION_CONFIG_TOKEN) private readonly config: RegistrationConfig
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
		const user = await this.userService.save(userDo);
		const account = this.createAccount(user, password);
		await this.accountService.saveWithValidation(account);

		if (user.id === undefined) {
			throw new InternalServerErrorException('User ID is undefined after saving user.');
		}
		await this.addUserToRooms(registration.roomIds, user.id);
		await this.registrationRepo.deleteByIds([registration.id]);
	}

	public async cancelRegistrationsForRoom(registrationIds: string[], roomId: string): Promise<Registration[] | null> {
		const updatedRegistrations: Registration[] = [];

		for (const registrationId of registrationIds) {
			const updatedRegistration = await this.cancelSingleRegistrationForRoom(registrationId, roomId);
			if (updatedRegistration) {
				updatedRegistrations.push(updatedRegistration);
			}
		}

		return updatedRegistrations.length > 0 ? updatedRegistrations : null;
	}

	public async saveRegistration(registration: Registration): Promise<void> {
		await this.registrationRepo.save(registration);
	}

	public async getSingleRegistrationById(registrationId: string): Promise<Registration> {
		const registrationResult = await this.registrationRepo.findById(registrationId);

		return registrationResult;
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
		const roomId = registration.roomIds[registration.roomIds.length - 1];
		const room = await this.roomService.getSingleRoom(roomId);
		const registrationMail = registration.generateRegistrationMail(room.name, this.config);

		await this.mailService.send(registrationMail);
	}

	public async resendRegistrationMails(registrationIds: string[]): Promise<Registration[] | null> {
		const resentRegistrations: Registration[] = [];

		for (const registrationId of registrationIds) {
			const resentRegistration = await this.resendSingleRegistrationMail(registrationId);
			if (resentRegistration) {
				resentRegistrations.push(resentRegistration);
			}
		}

		return resentRegistrations.length > 0 ? resentRegistrations : null;
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
			resentAt: undefined,
		};
		const registration = new Registration(registrationProps);

		await this.registrationRepo.save(registration);

		return registration;
	}

	private async createUser(registration: Registration, language: LanguageType): Promise<UserDo> {
		if (!registration.firstName || !registration.lastName) {
			throw new BadRequestException('Firstname and Lastname need to be set to create user.');
		}
		const externalPersonRole = await this.roleService.findByName(RoleName.EXTERNALPERSON).catch(() => {
			throw new BadRequestException('ExternalPerson role not found');
		});
		const roleRefs = [new RoleReference({ id: externalPersonRole.id, name: externalPersonRole.name })];

		const externalPersonsSchools = await this.schoolService.getSchools({
			purpose: SchoolPurpose.EXTERNAL_PERSON_SCHOOL,
		});
		if (externalPersonsSchools.length === 0 || externalPersonsSchools.length > 1) {
			throw new InternalServerErrorException('Number of externalPersonSchools in system is not valid - should be 1');
		}
		const schoolId = externalPersonsSchools[0].id;

		const newUser = new UserDo({
			roles: roleRefs,
			schoolId,
			firstName: registration.firstName,
			lastName: registration.lastName,
			email: registration.email,
			birthday: new Date('2000-01-01'), // necessary to avoid parental consent dialog for children (when logging in)
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

	private async addUserToRooms(roomIds: string[], userId: string): Promise<void> {
		const promises = roomIds.map((roomId) => this.roomMembershipService.addMembersToRoom(roomId, [userId]));
		await Promise.all(promises);
	}

	private async cancelSingleRegistrationForRoom(registrationId: string, roomId: string): Promise<Registration | null> {
		const registration = await this.getSingleRegistrationById(registrationId);

		registration.removeRoomId(roomId);

		if (registration.hasNoRoomIds()) {
			await this.registrationRepo.deleteByIds([registration.id]);
			return null;
		}

		await this.saveRegistration(registration);
		return registration;
	}

	private async resendSingleRegistrationMail(registrationId: string): Promise<Registration | null> {
		try {
			const registration = await this.getSingleRegistrationById(registrationId);

			const canBeResend = this.checkCanRegistrationMailBeResend(registration);
			if (!canBeResend) {
				return null;
			}

			registration.resentAt = new Date();
			await this.sendRegistrationMail(registration);

			await this.saveRegistration(registration);
			return registration;
		} catch {
			this.logger.warning(new ResendingRegistrationMailLoggable(registrationId));
			return null;
		}
	}

	private checkCanRegistrationMailBeResend(registration: Registration): boolean {
		if (!registration.resentAt) {
			return true;
		}

		const lastResent = new Date(registration.resentAt).getTime();
		const now = new Date().getTime();
		const TWO_MINUTES_MS = 2 * 60 * 1000;

		const twoMinutesHavePassed = now - lastResent >= TWO_MINUTES_MS;
		return twoMinutesHavePassed;
	}
}
