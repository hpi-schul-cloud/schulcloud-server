import { CalendarService } from '@infra/calendar';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardNodeAuthorizableService, BoardNodeService, BoardRoles } from '@modules/board';
import { VideoConferenceElement } from '@modules/board/domain';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { RoleName } from '@modules/role';
import { Room, RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { TeamEntity, TeamRepo, TeamUserEntity } from '@modules/team/repo';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { randomBytes } from 'node:crypto';
import { BBBRole } from '../bbb';
import { VideoConferenceDO, VideoConferenceOptionsDO, VideoConferenceScope } from '../domain';
import { ErrorStatus } from '../error';
import { VideoConferenceOptions } from '../interface';
import { VideoConferenceRepo } from '../repo';
import { ScopeInfo, VideoConferenceState } from '../uc/dto';
import { VIDEO_CONFERENCE_CONFIG_TOKEN, VideoConferenceConfig } from '../video-conference-config';

type ConferenceResource = CourseEntity | Room | TeamEntity | VideoConferenceElement;

@Injectable()
export class VideoConferenceService {
	constructor(
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeService: BoardNodeService,
		@Inject(VIDEO_CONFERENCE_CONFIG_TOKEN) private readonly config: VideoConferenceConfig,
		private readonly courseService: CourseService,
		private readonly calendarService: CalendarService,
		private readonly authorizationService: AuthorizationService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly roomService: RoomService,
		private readonly teamRepo: TeamRepo,
		private readonly userService: UserService,
		private readonly videoConferenceRepo: VideoConferenceRepo
	) {}

	get hostUrl(): string {
		return this.config.scHostUrl;
	}

	public canGuestJoin(isGuest: boolean, state: VideoConferenceState, waitingRoomEnabled: boolean): boolean {
		if ((isGuest && state === VideoConferenceState.NOT_STARTED) || (isGuest && !waitingRoomEnabled)) {
			return false;
		}
		return true;
	}

	public async isExternalPersonOrTeamExpert(
		userId: EntityId,
		conferenceScope: VideoConferenceScope,
		scopeId: string
	): Promise<boolean> {
		let isExternalPerson = false;
		switch (conferenceScope) {
			case VideoConferenceScope.COURSE:
			case VideoConferenceScope.ROOM:
			case VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT: {
				const user = await this.userService.findById(userId);
				isExternalPerson = this.existsOnlyExternalPersonRole(user.roles);

				return isExternalPerson;
			}
			case VideoConferenceScope.EVENT: {
				const team = await this.teamRepo.findById(scopeId);
				const teamUser = team.teamUsers.find((userInTeam: TeamUserEntity) => userInTeam.user.id === userId);

				if (teamUser === undefined) {
					throw new ForbiddenException(ErrorStatus.UNKNOWN_USER, 'Cannot find user in team.');
				}

				isExternalPerson = teamUser.role.name === RoleName.TEAMEXPERT;
				return isExternalPerson;
			}
			default:
				throw new BadRequestException('Unknown scope name.');
		}
	}

	private existsOnlyExternalPersonRole(roles: RoleReference[]): boolean {
		const roleNames = roles.map((role: RoleReference) => role.name);

		let isExternalPerson = roleNames.includes(RoleName.EXTERNALPERSON);

		if (isExternalPerson && roles.length > 1) {
			isExternalPerson = false;
		}

		return isExternalPerson;
	}

	// should be public to expose ressources to UC for passing it to authrisation and improve performance
	private async loadScopeResources(scopeId: EntityId, scope: VideoConferenceScope): Promise<ConferenceResource | null> {
		let scopeResource: ConferenceResource | null = null;

		if (scope === VideoConferenceScope.COURSE) {
			scopeResource = await this.courseService.findById(scopeId);
		} else if (scope === VideoConferenceScope.EVENT) {
			scopeResource = await this.teamRepo.findById(scopeId);
		} else if (scope === VideoConferenceScope.ROOM) {
			scopeResource = await this.roomService.getSingleRoom(scopeId);
		} else if (scope === VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT) {
			scopeResource = await this.boardNodeService.findByClassAndId(VideoConferenceElement, scopeId);
		} else {
			// Need to be solve the null with throw by it self.
		}

		return scopeResource;
	}

	private isNullOrUndefined(value: unknown): value is null {
		return !value;
	}

	private async hasStartMeetingAndCanRead(authorizableUser: User, entity: ConferenceResource): Promise<boolean> {
		if (entity instanceof Room) {
			const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(entity.id);
			const roomMember = roomAuthorizable.members.find((member) => member.userId === authorizableUser.id);

			if (roomMember) {
				return roomMember.roles.some((role) => role.name === RoleName.ROOMADMIN);
			}

			return false;
		}
		if (entity instanceof VideoConferenceElement) {
			const boardDoAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(entity);
			const boardAuthorisedUser = boardDoAuthorizable.users.find((user) => user.userId === authorizableUser.id);

			if (boardAuthorisedUser) {
				const canRoomEditorManageVideoconference =
					boardDoAuthorizable.boardContextSettings.canRoomEditorManageVideoconference ?? false;
				const isBoardEditor = boardAuthorisedUser.roles.includes(BoardRoles.EDITOR);
				const isBoardAdmin = boardAuthorisedUser.roles.includes(BoardRoles.ADMIN);
				return (canRoomEditorManageVideoconference && isBoardEditor) || isBoardAdmin;
			}

			return false;
		}
		const context = AuthorizationContextBuilder.read([Permission.START_MEETING]);
		const hasPermission = this.authorizationService.hasPermission(authorizableUser, entity, context);

		return hasPermission;
	}

	private async hasJoinMeetingAndCanRead(authorizableUser: User, entity: ConferenceResource): Promise<boolean> {
		if (entity instanceof Room) {
			const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(entity.id);
			const roomMember = roomAuthorizable.members.find((member) => member.userId === authorizableUser.id);

			if (roomMember) {
				return (
					roomMember.roles.some((role) => role.name === RoleName.ROOMVIEWER) ||
					roomMember.roles.some((role) => role.name === RoleName.ROOMEDITOR)
				);
			}

			return false;
		}
		if (entity instanceof VideoConferenceElement) {
			const boardDoAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(entity);
			const boardAuthorisedUser = boardDoAuthorizable.users.find((user) => user.userId === authorizableUser.id);

			if (boardAuthorisedUser) {
				const boardUserRoles = boardAuthorisedUser.roles;
				return [BoardRoles.READER, BoardRoles.EDITOR].some((role) => boardUserRoles.includes(role));
			}

			return false;
		}
		const context = AuthorizationContextBuilder.read([Permission.JOIN_MEETING]);
		const hasPermission = this.authorizationService.hasPermission(authorizableUser, entity, context);

		return hasPermission;
	}

	public async determineBbbRole(userId: EntityId, scopeId: EntityId, scope: VideoConferenceScope): Promise<BBBRole> {
		// ressource loading need to be move to uc
		const [authorizableUser, scopeResource] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.loadScopeResources(scopeId, scope),
		]);

		if (!this.isNullOrUndefined(scopeResource)) {
			if (await this.hasStartMeetingAndCanRead(authorizableUser, scopeResource)) {
				return BBBRole.MODERATOR;
			}
			if (await this.hasJoinMeetingAndCanRead(authorizableUser, scopeResource)) {
				return BBBRole.VIEWER;
			}
		}

		throw new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION);
	}

	public sanitizeString(text: string): string {
		return text.replace(/[^\dA-Za-zÀ-ÖØ-öø-ÿ.\-=_`´ ]/g, '');
	}

	public async getScopeInfo(userId: EntityId, scopeId: string, scope: VideoConferenceScope): Promise<ScopeInfo> {
		const ensureMinTitleLength = (title: string): string => {
			const trimmedTitle = title.trim();
			if (trimmedTitle.length >= 2) {
				return trimmedTitle;
			}
			return trimmedTitle.padEnd(2, '_');
		};

		switch (scope) {
			case VideoConferenceScope.COURSE: {
				const course = await this.courseService.findById(scopeId);

				return {
					scopeId,
					scopeName: VideoConferenceScope.COURSE,
					logoutUrl: `${this.hostUrl}/courses/${scopeId}?activeTab=tools`,
					title: ensureMinTitleLength(course.name),
				};
			}
			case VideoConferenceScope.EVENT: {
				const event = await this.calendarService.findEvent(userId, scopeId);

				return {
					scopeId: event.teamId,
					scopeName: VideoConferenceScope.EVENT,
					logoutUrl: `${this.hostUrl}/teams/${event.teamId}?activeTab=events`,
					title: ensureMinTitleLength(event.title),
				};
			}
			case VideoConferenceScope.ROOM: {
				const room = await this.roomService.getSingleRoom(scopeId);

				return {
					scopeId: room.id,
					scopeName: VideoConferenceScope.ROOM,
					logoutUrl: `${this.hostUrl}/rooms/${room.id}`,
					title: ensureMinTitleLength(room.name),
				};
			}
			case VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT: {
				const element = await this.boardNodeService.findByClassAndId(VideoConferenceElement, scopeId);

				return {
					scopeId: element.id,
					scopeName: VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT,
					logoutUrl: `${this.hostUrl}/boards/${element.rootId}`,
					title: ensureMinTitleLength(element.title),
				};
			}
			default:
				throw new BadRequestException('Unknown scope name');
		}
	}

	public async getUserRoleAndGuestStatusByUserIdForBbb(
		userId: string,
		scopeId: EntityId,
		scope: VideoConferenceScope
	): Promise<{ role: BBBRole; isGuest: boolean }> {
		const scopeInfo = await this.getScopeInfo(userId, scopeId, scope);

		const role = await this.determineBbbRole(userId, scopeInfo.scopeId, scope);

		const isBbbGuest = await this.isExternalPersonOrTeamExpert(userId, scope, scopeInfo.scopeId);

		return { role, isGuest: isBbbGuest };
	}

	public async findVideoConferenceByScopeIdAndScope(
		scopeId: EntityId,
		scope: VideoConferenceScope
	): Promise<VideoConferenceDO> {
		const videoConference = await this.videoConferenceRepo.findByScopeAndScopeId(scopeId, scope);

		return videoConference;
	}

	public async createOrUpdateVideoConferenceForScopeWithOptions(
		scopeId: EntityId,
		scope: VideoConferenceScope,
		options: VideoConferenceOptions
	): Promise<VideoConferenceDO> {
		let vcDo: VideoConferenceDO;

		// try and catch based on legacy behavior
		try {
			vcDo = await this.findVideoConferenceByScopeIdAndScope(scopeId, scope);
			vcDo.salt = randomBytes(16).toString('hex');

			vcDo.options = new VideoConferenceOptionsDO(options);
		} catch (error) {
			vcDo = new VideoConferenceDO({
				target: scopeId,
				targetModel: scope,
				options: new VideoConferenceOptionsDO(options),
				salt: randomBytes(16).toString('hex'),
			});
		}

		vcDo = await this.saveVideoConference(vcDo);

		return vcDo;
	}

	private saveVideoConference(videoConference: VideoConferenceDO): Promise<VideoConferenceDO> {
		return this.videoConferenceRepo.save(videoConference);
	}
}
