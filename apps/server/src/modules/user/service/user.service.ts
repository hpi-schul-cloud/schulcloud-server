import { Logger } from '@core/logger';
import { CalendarService } from '@infra/calendar';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import {
	DataDeletedEvent,
	DataDeletionDomainOperationLoggable,
	DeletionErrorLoggableException,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReport,
	DomainOperationReportBuilder,
	OperationReportHelper,
	OperationType,
	StatusModel,
	UserDeletedEvent,
} from '@modules/deletion';
import { RegistrationPinService } from '@modules/registration-pin';
import { RoleDto, RoleService } from '@modules/role';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Page, RoleReference } from '@shared/domain/domainobject';
import { IFindOptions, LanguageType, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { UserDo } from '../domain';
import { UserConfig } from '../interfaces';
import { AddSecondarySchoolToUsersRoleErrorLoggableException } from '../loggable/addSecondarySchoolToUserError.loggable';
import { UserMapper } from '../mapper/user.mapper';
import { User, UserDORepo, UserRepo } from '../repo';
import { UserDto } from '../uc/dto/user.dto';
import { UserDiscoverableQuery, UserQuery } from './user-query.type';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class UserService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly userDORepo: UserDORepo,
		private readonly configService: ConfigService<UserConfig, true>,
		private readonly roleService: RoleService,
		private readonly registrationPinService: RegistrationPinService,
		private readonly calendarService: CalendarService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(UserService.name);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	public async getUserEntityWithRoles(userId: EntityId): Promise<User> {
		// only roles required, no need for the other populates
		const userWithRoles = await this.userRepo.findById(userId, true);

		return userWithRoles;
	}

	public async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = user.resolvePermissions();

		return [user, permissions];
	}

	/**
	 * @deprecated use {@link UserService.findById} instead
	 */
	public async getUser(id: string): Promise<UserDto> {
		const userEntity = await this.userRepo.findById(id, true);
		const userDto = UserMapper.mapFromEntityToDto(userEntity);

		return userDto;
	}

	public async findById(id: string): Promise<UserDo> {
		const userDO = await this.userDORepo.findById(id, true);

		return userDO;
	}

	public async findByIds(ids: string[]): Promise<UserDo[]> {
		const userDOs = await this.userDORepo.findByIds(ids, true);

		return userDOs;
	}

	public async findByIdOrNull(id: string): Promise<UserDo | null> {
		const userDO = await this.userDORepo.findByIdOrNull(id, true);

		return userDO;
	}

	public async save(user: UserDo): Promise<UserDo> {
		const savedUser = await this.userDORepo.save(user);

		return savedUser;
	}

	public async saveAll(users: UserDo[]): Promise<UserDo[]> {
		const savedUsers = await this.userDORepo.saveAll(users);

		return savedUsers;
	}

	public async findUsers(query: UserQuery, options?: IFindOptions<UserDo>): Promise<Page<UserDo>> {
		const users = await this.userDORepo.find(query, options);

		return users;
	}

	public async findBySchoolRole(
		schoolId: EntityId,
		roleName: RoleName,
		options?: IFindOptions<UserDo>
	): Promise<Page<UserDo>> {
		const role = await this.roleService.findByName(roleName);
		const query = { schoolId, roleId: role.id };
		const result = await this.findUsers(query, options);
		return result;
	}

	public async findPublicTeachersBySchool(schoolId: EntityId, options?: IFindOptions<UserDo>): Promise<Page<UserDo>> {
		const discoverabilitySetting = this.configService.get<string>('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION');
		if (discoverabilitySetting === 'disabled') {
			return new Page<UserDo>([], 0);
		}

		const role = await this.roleService.findByName(RoleName.TEACHER);
		const query: UserQuery = { schoolId, roleId: role.id };

		if (discoverabilitySetting === 'opt-out') {
			query.discoverable = UserDiscoverableQuery.NOT_FALSE;
		}
		if (discoverabilitySetting === 'opt-in') {
			query.discoverable = UserDiscoverableQuery.TRUE;
		}

		const result = await this.findUsers(query, options);
		return result;
	}

	public async addSecondarySchoolToUsers(userIds: string[], schoolId: EntityId): Promise<void> {
		const users = await this.userDORepo.findByIds(userIds, true);
		const guestStudent = await this.roleService.findByName(RoleName.GUESTSTUDENT);
		const guestTeacher = await this.roleService.findByName(RoleName.GUESTTEACHER);

		const roleMapping: Record<string, RoleDto> = {
			[RoleName.STUDENT]: guestStudent,
			[RoleName.TEACHER]: guestTeacher,
			[RoleName.ADMINISTRATOR]: guestTeacher,
		};

		users
			.filter((user) => user.schoolId !== schoolId)
			.filter((user) => !user.secondarySchools.some((school) => school.schoolId === schoolId))
			.forEach((user) => {
				const guestRole = roleMapping[user.roles[0].name];

				if (!guestRole) {
					throw new AddSecondarySchoolToUsersRoleErrorLoggableException({ roles: user.roles });
				}
				user.secondarySchools.push({ schoolId, role: new RoleReference(guestRole) });
			});

		await this.userDORepo.saveAll(users);
	}

	public async removeSecondarySchoolFromUsers(userIds: string[], schoolId: EntityId): Promise<void> {
		const users = await this.userDORepo.findByIds(userIds, true);

		users.forEach((user) => {
			user.secondarySchools = user.secondarySchools.filter((school) => school.schoolId !== schoolId);
		});

		await this.userDORepo.saveAll(users);
	}

	public async findByExternalId(externalId: string, systemId: EntityId): Promise<UserDo | null> {
		const user = await this.userDORepo.findByExternalId(externalId, systemId);

		return user;
	}

	public async findByEmail(email: string): Promise<UserDo[]> {
		const user = await this.userDORepo.findByEmail(email);

		return user;
	}

	/** @deprecated Please put this methode to do and do role check as part of authorisation in used context. */
	public async getDisplayName(user: UserDo): Promise<string> {
		const protectedRoles = await this.roleService.getProtectedRoles();
		const isProtectedUser = user.roles.some(
			(roleRef: RoleReference): boolean =>
				!!protectedRoles.find((protectedRole: RoleDto) => roleRef.id === protectedRole.id)
		);

		const displayName = isProtectedUser ? user.lastName : `${user.firstName} ${user.lastName}`;

		return displayName;
	}

	public async patchLanguage(userId: EntityId, newLanguage: LanguageType): Promise<boolean> {
		this.checkAvailableLanguages(newLanguage);
		const user = await this.userRepo.findById(userId);
		user.language = newLanguage;
		await this.userRepo.save(user);

		return true;
	}

	private checkAvailableLanguages(language: LanguageType): void {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(language)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	public async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable('Deleting user', DomainName.USER, userId, StatusModel.PENDING)
		);

		const userToDelete = await this.userRepo.findByIdOrNull(userId, true);

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

		const subdomainOperation: DomainDeletionReport[] = [];
		const registrationPinDeleted = await this.removeUserRegistrationPin(userId);
		subdomainOperation.push(registrationPinDeleted);

		if (this.configService.get<boolean>('CALENDAR_SERVICE_ENABLED')) {
			const calendarEventsDeleted = await this.removeCalendarEvents(userId);
			subdomainOperation.push(calendarEventsDeleted);
		}

		const numberOfDeletedUsers = await this.userRepo.deleteUser(userId);

		if (numberOfDeletedUsers === 0) {
			throw new DeletionErrorLoggableException(`Failed to delete user '${userId}' from User collection`);
		}

		const result = DomainDeletionReportBuilder.build(
			DomainName.USER,
			[DomainOperationReportBuilder.build(OperationType.DELETE, numberOfDeletedUsers, [userId])],
			subdomainOperation
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
		const parentEmails = await this.userRepo.getParentEmailsFromUser(userId);

		return parentEmails;
	}

	public async findUserBySchoolAndName(schoolId: EntityId, firstName: string, lastName: string): Promise<User[]> {
		const users = await this.userRepo.findUserBySchoolAndName(schoolId, firstName, lastName);

		return users;
	}

	public async findMultipleByExternalIds(externalIds: string[]): Promise<string[]> {
		const userIds = await this.userRepo.findByExternalIds(externalIds);

		return userIds;
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

	public async findUnsynchronizedUserIds(unsyncedForMinutes: number): Promise<string[]> {
		const unsyncedForMiliseconds = unsyncedForMinutes * 60000;
		const differenceBetweenCurrentDateAndUnsyncedTime = new Date().getTime() - unsyncedForMiliseconds;
		const dateOfLastSyncToBeLookedFrom = new Date(differenceBetweenCurrentDateAndUnsyncedTime);
		const userIds = await this.userRepo.findUnsynchronizedUserIds(dateOfLastSyncToBeLookedFrom);
		return userIds;
	}

	public async removeCalendarEvents(userId: EntityId): Promise<DomainDeletionReport> {
		let extractedOperationReport: DomainOperationReport[] = [];
		const results = await this.calendarService.deleteUserData(userId);

		extractedOperationReport = OperationReportHelper.extractOperationReports([results]);

		return DomainDeletionReportBuilder.build(DomainName.CALENDAR, extractedOperationReport);
	}

	public findByTspUids(tspUids: string[]): Promise<UserDo[]> {
		const userDOs = this.userDORepo.findByTspUids(tspUids);

		return userDOs;
	}
}
