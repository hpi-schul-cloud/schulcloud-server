import { AccountService, Account } from '@modules/account';
// invalid import
import { OauthCurrentUser } from '@modules/authentication/interface';
import { CurrentUserMapper } from '@modules/authentication/mapper';
import { RoleDto, RoleService } from '@modules/role';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page, RoleReference, UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { Logger } from '@src/core/logger';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { RegistrationPinService } from '@modules/registration-pin';
import { User } from '@shared/domain/entity';
import { IFindOptions, LanguageType } from '@shared/domain/interface';
import {
	UserDeletedEvent,
	DeletionService,
	DataDeletedEvent,
	DomainDeletionReport,
	DataDeletionDomainOperationLoggable,
	DomainName,
	DomainDeletionReportBuilder,
	DomainOperationReportBuilder,
	OperationType,
	DeletionErrorLoggableException,
	DomainOperationReport,
	StatusModel,
	OperationReportHelper,
} from '@modules/deletion';
import { CalendarService } from '@src/infra/calendar';
import { UserQuery } from './user-query.type';
import { UserDto } from '../uc/dto/user.dto';
import { UserMapper } from '../mapper/user.mapper';
import { UserConfig } from '../interfaces';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class UserService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly userDORepo: UserDORepo,
		private readonly configService: ConfigService<UserConfig, true>,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService,
		private readonly registrationPinService: RegistrationPinService,
		private readonly calendarService: CalendarService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(UserService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	async getUserEntityWithRoles(userId: EntityId): Promise<User> {
		// only roles required, no need for the other populates
		const userWithRoles = await this.userRepo.findById(userId, true);

		return userWithRoles;
	}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = user.resolvePermissions();

		return [user, permissions];
	}

	/**
	 * @deprecated use {@link UserService.findById} instead
	 */
	async getUser(id: string): Promise<UserDto> {
		const userEntity = await this.userRepo.findById(id, true);
		const userDto = UserMapper.mapFromEntityToDto(userEntity);

		return userDto;
	}

	async getResolvedUser(userId: EntityId): Promise<OauthCurrentUser> {
		const user: UserDO = await this.findById(userId);
		const account: Account = await this.accountService.findByUserIdOrFail(userId);

		const resolvedUser: OauthCurrentUser = CurrentUserMapper.mapToOauthCurrentUser(account.id, user, account.systemId);

		return resolvedUser;
	}

	async findById(id: string): Promise<UserDO> {
		const userDO = await this.userDORepo.findById(id, true);

		return userDO;
	}

	public async findByIdOrNull(id: string): Promise<UserDO | null> {
		const userDO: UserDO | null = await this.userDORepo.findByIdOrNull(id, true);

		return userDO;
	}

	async save(user: UserDO): Promise<UserDO> {
		const savedUser: Promise<UserDO> = this.userDORepo.save(user);

		return savedUser;
	}

	async saveAll(users: UserDO[]): Promise<UserDO[]> {
		const savedUsers: Promise<UserDO[]> = this.userDORepo.saveAll(users);

		return savedUsers;
	}

	async findUsers(query: UserQuery, options?: IFindOptions<UserDO>): Promise<Page<UserDO>> {
		const users: Page<UserDO> = await this.userDORepo.find(query, options);

		return users;
	}

	async findByExternalId(externalId: string, systemId: EntityId): Promise<UserDO | null> {
		const user: Promise<UserDO | null> = this.userDORepo.findByExternalId(externalId, systemId);

		return user;
	}

	async findByEmail(email: string): Promise<UserDO[]> {
		const user: Promise<UserDO[]> = this.userDORepo.findByEmail(email);

		return user;
	}

	async getDisplayName(user: UserDO): Promise<string> {
		const protectedRoles: RoleDto[] = await this.roleService.getProtectedRoles();
		const isProtectedUser: boolean = user.roles.some(
			(roleRef: RoleReference): boolean =>
				!!protectedRoles.find((protectedRole: RoleDto): boolean => roleRef.id === protectedRole.id)
		);

		const displayName: string = isProtectedUser ? user.lastName : `${user.firstName} ${user.lastName}`;

		return displayName;
	}

	async patchLanguage(userId: EntityId, newLanguage: LanguageType): Promise<boolean> {
		this.checkAvailableLanguages(newLanguage);
		const user = await this.userRepo.findById(userId);
		user.language = newLanguage;
		await this.userRepo.save(user);

		return true;
	}

	private checkAvailableLanguages(language: LanguageType): void | BadRequestException {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(language)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable('Deleting user', DomainName.USER, userId, StatusModel.PENDING)
		);

		const userToDelete: User | null = await this.userRepo.findByIdOrNull(userId, true);

		if (userToDelete === null) {
			const result = DomainDeletionReportBuilder.build(DomainName.USER, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 0, []),
			]);

			this.logger.info(
				new DataDeletionDomainOperationLoggable(
					'User already deleted',
					DomainName.USER,
					userId,
					StatusModel.FINISHED,
					0,
					0
				)
			);

			return result;
		}

		const registrationPinDeleted = await this.removeUserRegistrationPin(userId);

		const calendarEventsDeleted = await this.removeCalendarEvents(userId);

		const numberOfDeletedUsers = await this.userRepo.deleteUser(userId);

		if (numberOfDeletedUsers === 0) {
			throw new DeletionErrorLoggableException(`Failed to delete user '${userId}' from User collection`);
		}

		const result = DomainDeletionReportBuilder.build(
			DomainName.USER,
			[DomainOperationReportBuilder.build(OperationType.DELETE, numberOfDeletedUsers, [userId])],
			[registrationPinDeleted, calendarEventsDeleted]
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user',
				DomainName.USER,
				userId,
				StatusModel.FINISHED,
				0,
				numberOfDeletedUsers
			)
		);

		return result;
	}

	public async getParentEmailsFromUser(userId: EntityId): Promise<string[]> {
		const parentEmails = this.userRepo.getParentEmailsFromUser(userId);

		return parentEmails;
	}

	public async findUserBySchoolAndName(schoolId: EntityId, firstName: string, lastName: string): Promise<User[]> {
		const users: User[] = await this.userRepo.findUserBySchoolAndName(schoolId, firstName, lastName);

		return users;
	}

	public async findByExternalIdsAndProvidedBySystemId(externalIds: string[], systemId: string): Promise<string[]> {
		const foundUsers = await this.findMultipleByExternalIds(externalIds);

		const verifiedUsers = await this.accountService.findByUserIdsAndSystemId(foundUsers, systemId);

		return verifiedUsers;
	}

	public async findMultipleByExternalIds(externalIds: string[]): Promise<string[]> {
		return this.userRepo.findByExternalIds(externalIds);
	}

	public async updateLastSyncedAt(userIds: string[]): Promise<void> {
		await this.userRepo.updateAllUserByLastSyncedAt(userIds);
	}

	public async removeUserRegistrationPin(userId: EntityId): Promise<DomainDeletionReport> {
		const userToDeletion = await this.userRepo.findByIdOrNull(userId);
		const parentEmails = await this.getParentEmailsFromUser(userId);
		let emailsToDeletion: string[] = [];
		if (userToDeletion && userToDeletion.email) {
			emailsToDeletion = [userToDeletion.email, ...parentEmails];
		}

		let extractedOperationReport: DomainOperationReport[] = [];
		if (emailsToDeletion.length > 0) {
			const results = await Promise.all(
				emailsToDeletion.map((email) => this.registrationPinService.deleteUserData(email))
			);

			extractedOperationReport = OperationReportHelper.extractOperationReports(results);
		} else {
			extractedOperationReport = [DomainOperationReportBuilder.build(OperationType.DELETE, 0, [])];
		}

		return DomainDeletionReportBuilder.build(DomainName.REGISTRATIONPIN, extractedOperationReport);
	}

	public async removeCalendarEvents(userId: EntityId): Promise<DomainDeletionReport> {
		let extractedOperationReport: DomainOperationReport[] = [];
		const results = await this.calendarService.deleteUserData(userId);

		extractedOperationReport = OperationReportHelper.extractOperationReports([results]);

		return DomainDeletionReportBuilder.build(DomainName.CALENDAR, extractedOperationReport);
	}
}
