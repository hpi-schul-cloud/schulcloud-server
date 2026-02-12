import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { Pseudonym } from '@modules/pseudonym/repo';
import { PseudonymService } from '@modules/pseudonym/service';
import { RoleName } from '@modules/role';
import { Room, RoomService } from '@modules/room';
import { RoomAuthorizable, RoomMembershipService } from '@modules/room-membership';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool/service';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { RoleReference } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardExternalReferenceType, ColumnBoard, ColumnBoardService } from '../../board';
import { ExternalToolElement } from '../../board/domain';
import { RosterConfig } from '../roster.config';

interface UserMetadata {
	data: {
		user_id: string;
		username: string;
		type: string;
	};
}

interface UserGroups {
	data: {
		groups: UserGroup[];
	};
}

interface UserGroup {
	group_id: string;
	name: string;
	student_count: number;
}

interface UserData {
	user_id: string;
	username: string;
}

interface Group {
	data: {
		students: UserData[];
		teachers: UserData[];
	};
}

type RoomUserMappingType = 'roomRoles' | 'userRoles';

/**
 * Please do not use this service in any other nest modules.
 * This service will be called from feathers to get the roster data for ctl pseudonyms {@link ExternalToolPseudonymEntity}.
 * These data will be used e.g. by bettermarks to resolve and display the usernames.
 */
@Injectable() // Why Feathers in name?
export class FeathersRosterService {
	constructor(
		private readonly userService: UserService,
		private readonly pseudonymService: PseudonymService,
		private readonly courseService: CourseService,
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly configService: ConfigService<RosterConfig, true>
	) {}

	public async getUsersMetadata(pseudonym: string): Promise<UserMetadata> {
		const loadedPseudonym = await this.findPseudonymByPseudonym(pseudonym);
		const user = await this.userService.findById(loadedPseudonym.userId);

		const userMetadata: UserMetadata = {
			data: {
				user_id: user.id as string,
				username: this.pseudonymService.getIframeSubject(loadedPseudonym.pseudonym),
				type: this.getUserRole(user),
			},
		};

		return userMetadata;
	}

	public async getUserGroups(pseudonym: string, oauth2ClientId: string): Promise<UserGroups> {
		const pseudonymContext = await this.findPseudonymByPseudonym(pseudonym);
		const user = await this.userService.findById(pseudonymContext.userId);

		const externalTool = await this.validateAndGetExternalTool(oauth2ClientId);
		const schoolExternalTool = await this.validateSchoolExternalTool(user.schoolId, externalTool.id);

		const coursesUserGroups = await this.getCoursesUserGroups(pseudonymContext, schoolExternalTool, user.schoolId);
		const roomsUserGroups = await this.getRoomsUserGroups(pseudonymContext, schoolExternalTool);

		const userGroups: UserGroups = {
			data: {
				groups: [...coursesUserGroups, ...roomsUserGroups],
			},
		};

		return userGroups;
	}

	public async getGroup(id: EntityId, oauth2ClientId: string): Promise<Group> {
		let group: Group;

		const roomExists = await this.roomService.roomExists(id);

		if (roomExists) {
			const room = await this.roomService.getSingleRoom(id);

			const roomMembers = await this.roomMembershipService.getRoomAuthorizable(room.id);
			const hasOwner = roomMembers.members.some((member) =>
				member.roles.some((role) => role.name === RoleName.ROOMOWNER)
			);
			if (!hasOwner) {
				throw new NotFoundLoggableException(RoomAuthorizable.name, { roomId: room.id });
			}

			const externalTool = await this.validateContextExternalTools(room, room.schoolId, oauth2ClientId);

			group = await this.getRoomGroup(roomMembers, externalTool);
		} else {
			const course: CourseEntity = await this.courseService.findById(id);
			const externalTool = await this.validateContextExternalTools(course, course.school.id, oauth2ClientId);
			group = await this.getCourseGroup(course, externalTool);
		}

		return group;
	}

	private async getCoursesUserGroups(
		pseudonymContext: Pseudonym,
		schoolExternalTool: SchoolExternalTool,
		userSchoolId: EntityId
	): Promise<UserGroup[]> {
		let [courses] = await this.courseService.findAllByUserId(pseudonymContext.userId, userSchoolId);
		courses = await this.filterByToolAvailability(courses, schoolExternalTool);

		const coursesUserGroups = courses.map((course) => {
			const courseUserGroup: UserGroup = {
				group_id: course.id,
				name: course.name,
				student_count: course.students.length,
			};
			return courseUserGroup;
		});

		return coursesUserGroups;
	}

	private async getRoomsUserGroups(
		pseudonymContext: Pseudonym,
		schoolExternalTool: SchoolExternalTool
	): Promise<UserGroup[]> {
		let rooms = await this.getRoomsForUser(pseudonymContext.userId);
		rooms = await this.filterByToolAvailability(rooms, schoolExternalTool);

		const roomUserGroups = await Promise.all(
			rooms.map(async (room: Room) => {
				const roomMembership = await this.roomMembershipService.getRoomAuthorizable(room.id);
				const { students } = await this.mapRoomUsers(roomMembership, 'userRoles');

				const userGroup: UserGroup = {
					group_id: room.id,
					name: room.name,
					student_count: students.length,
				};

				return userGroup;
			})
		);
		return roomUserGroups;
	}

	private async getRoomsForUser(userId: EntityId): Promise<Room[]> {
		const roomAuthorizables = await this.roomMembershipService.getRoomAuthorizablesByUserId(userId);
		if (!roomAuthorizables) return [];
		const roomIds = roomAuthorizables.map((item) => item.roomId);

		const rooms = await this.roomService.getRoomsByIds(roomIds);

		const filteredRooms = rooms.filter((room) => {
			const hasOwner = roomAuthorizables.some(
				(item) =>
					item.roomId === room.id &&
					item.members.some((member) => member.roles.some((role) => role.name === RoleName.ROOMOWNER))
			);
			return hasOwner;
		});

		return filteredRooms;
	}

	private async filterByToolAvailability<T extends CourseEntity | Room>(
		items: T[],
		schoolExternalTool: SchoolExternalTool
	): Promise<T[]> {
		const validItems: T[] = [];
		await Promise.all(
			items.map(async (item: T): Promise<void> => {
				const isExternalToolReferenced = await this.isExternalToolReferenced(item, schoolExternalTool);
				if (isExternalToolReferenced) {
					validItems.push(item);
				}
			})
		);
		return validItems;
	}

	private async getRoomGroup(roomMembers: RoomAuthorizable, externalTool: ExternalTool): Promise<Group> {
		const { students, teachers } = await this.mapRoomUsers(roomMembers, 'userRoles');

		const [studentPseudonyms, teacherPseudonyms] = await Promise.all([
			this.getAndPseudonyms(students, externalTool),
			this.getAndPseudonyms(teachers, externalTool),
		]);

		const group = {
			data: {
				students: studentPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
				teachers: teacherPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
			},
		};

		return group;
	}

	private async mapRoomUsers(
		roomMembers: RoomAuthorizable,
		mappingType: RoomUserMappingType
	): Promise<{ students: UserDo[]; teachers: UserDo[] }> {
		let students: UserDo[] = [];
		let teachers: UserDo[] = [];

		if (mappingType === 'roomRoles') {
			// this mapping is for now not used, but might change in the future
			/*
			const teacherRoomRoles = [RoleName.ROOMADMIN, RoleName.ROOMEDITOR, RoleName.ROOMOWNER];
			const studentRoomRoles = [RoleName.ROOMVIEWER];
			const teacherMembers = roomMembers.members.filter((member) =>
				member.roles.some((role) => teacherRoomRoles.includes(role.name))
			);
			const studentMembers = roomMembers.members.filter((member) =>
				member.roles.some((role) => studentRoomRoles.includes(role.name))
			);

			[students, teachers] = await Promise.all([
				Promise.all(studentMembers.map((user) => this.userService.findById(user.userId))),
				Promise.all(teacherMembers.map((user) => this.userService.findById(user.userId))),
			]);
			 */
		} else if (mappingType === 'userRoles') {
			const teacherRoles = [RoleName.TEACHER, RoleName.COURSETEACHER, RoleName.COURSESUBSTITUTIONTEACHER];
			const studentRoles = [RoleName.STUDENT, RoleName.COURSESTUDENT];
			const members = await Promise.all(roomMembers.members.map((member) => this.userService.findById(member.userId)));

			students = members.filter((user) => user.roles.some((role) => studentRoles.includes(role.name)));
			teachers = members.filter((user) => user.roles.some((role) => teacherRoles.includes(role.name)));
		}

		return { students, teachers };
	}

	private async getCourseGroup(course: CourseEntity, externalTool: ExternalTool): Promise<Group> {
		const [studentEntities, teacherEntities, substitutionTeacherEntities] = await Promise.all([
			course.students.loadItems(),
			course.teachers.loadItems(),
			course.substitutionTeachers.loadItems(),
		]);

		const [students, teachers, substitutionTeachers] = await Promise.all([
			Promise.all(studentEntities.map((user) => this.userService.findById(user.id))),
			Promise.all(teacherEntities.map((user) => this.userService.findById(user.id))),
			Promise.all(substitutionTeacherEntities.map((user) => this.userService.findById(user.id))),
		]);

		const [studentPseudonyms, teacherPseudonyms, substitutionTeacherPseudonyms] = await Promise.all([
			this.getAndPseudonyms(students, externalTool),
			this.getAndPseudonyms(teachers, externalTool),
			this.getAndPseudonyms(substitutionTeachers, externalTool),
		]);

		const allTeacherPseudonyms = teacherPseudonyms.concat(substitutionTeacherPseudonyms);

		const group = {
			data: {
				students: studentPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
				teachers: allTeacherPseudonyms.map((pseudonym: Pseudonym) => this.mapPseudonymToUserData(pseudonym)),
			},
		};

		return group;
	}

	private async getAndPseudonyms(users: UserDo[], externalTool: ExternalTool): Promise<Pseudonym[]> {
		const pseudonyms: Pseudonym[] = await Promise.all(
			users.map((user: UserDo) => this.pseudonymService.findOrCreatePseudonym(user, externalTool))
		);

		return pseudonyms;
	}

	private getUserRole(user: UserDo): string {
		const roleName = user.roles.some((role: RoleReference) => role.name === RoleName.TEACHER)
			? RoleName.TEACHER
			: RoleName.STUDENT;

		return roleName;
	}

	private async findPseudonymByPseudonym(pseudonym: string): Promise<Pseudonym> {
		const loadedPseudonym = await this.pseudonymService.findPseudonymByPseudonym(pseudonym);

		if (!loadedPseudonym) {
			throw new NotFoundLoggableException(Pseudonym.name, { pseudonym });
		}

		return loadedPseudonym;
	}

	private async isExternalToolReferenced(
		context: CourseEntity | Room,
		schoolExternalTool: SchoolExternalTool
	): Promise<boolean> {
		if (context instanceof CourseEntity) {
			const contextExternalTools: ContextExternalTool[] =
				await this.contextExternalToolService.findContextExternalTools({
					context: {
						id: context.id,
						type: ToolContextType.COURSE,
					},
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
					},
				});

			if (contextExternalTools.length > 0) {
				return true;
			}
		}

		if (this.configService.get<boolean>('FEATURE_COLUMN_BOARD_EXTERNAL_TOOLS_ENABLED')) {
			const columnBoards: ColumnBoard[] = await this.columnBoardService.findByExternalReference({
				type: context instanceof CourseEntity ? BoardExternalReferenceType.Course : BoardExternalReferenceType.Room,
				id: context.id,
			});

			const isExternalToolReferencedInColumnBoard: boolean[] = await Promise.all(
				columnBoards.map(
					async (columnBoard: ColumnBoard): Promise<boolean> =>
						this.isExternalToolReferencedInColumnBoard(columnBoard, schoolExternalTool)
				)
			);

			if (isExternalToolReferencedInColumnBoard.some(Boolean)) {
				return true;
			}
		}

		return false;
	}

	private async isExternalToolReferencedInColumnBoard(
		columnBoard: ColumnBoard,
		schoolExternalTool: SchoolExternalTool
	): Promise<boolean> {
		const elements = columnBoard.getChildrenOfType(ExternalToolElement);

		const hasRequestedTool = await Promise.all(
			elements.map(async (element: ExternalToolElement): Promise<boolean> => {
				if (!element.contextExternalToolId) {
					return false;
				}

				const contextExternalTool = await this.contextExternalToolService.findById(element.contextExternalToolId);

				const isRequestedTool = contextExternalTool?.schoolToolRef.schoolToolId === schoolExternalTool.id;

				return isRequestedTool;
			})
		);

		const hasTool = hasRequestedTool.some(Boolean);

		return hasTool;
	}

	private async validateAndGetExternalTool(oauth2ClientId: string): Promise<ExternalTool> {
		const externalTool = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(oauth2ClientId);

		if (!externalTool || !externalTool.id || externalTool.isDeactivated) {
			throw new NotFoundLoggableException(ExternalTool.name, { 'config.clientId': oauth2ClientId });
		}

		return externalTool;
	}

	private async validateSchoolExternalTool(schoolId: EntityId, toolId: string): Promise<SchoolExternalTool> {
		const schoolExternalTools = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId,
			toolId,
			isDeactivated: false,
		});

		if (schoolExternalTools.length === 0) {
			throw new NotFoundLoggableException(SchoolExternalTool.name, { toolId });
		}

		return schoolExternalTools[0];
	}

	private async validateContextExternalTools(
		context: CourseEntity | Room,
		schoolId: EntityId,
		oauth2ClientId: string
	): Promise<ExternalTool> {
		const externalTool = await this.validateAndGetExternalTool(oauth2ClientId);
		const schoolExternalTool = await this.validateSchoolExternalTool(schoolId, externalTool.id);
		const isExternalToolReferenced = await this.isExternalToolReferenced(context, schoolExternalTool);

		if (!isExternalToolReferenced) {
			throw new NotFoundLoggableException(ContextExternalTool.name, { contextId: context.id });
		}

		return externalTool;
	}

	private mapPseudonymToUserData(pseudonym: Pseudonym): UserData {
		const userData = {
			user_id: pseudonym.pseudonym,
			username: this.pseudonymService.getIframeSubject(pseudonym.pseudonym),
		};

		return userData;
	}
}
