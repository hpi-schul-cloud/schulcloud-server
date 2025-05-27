import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/course';
import { RoomMembershipAuthorizable, RoomMembershipService, UserWithRoomRoles } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { userFactory } from '@modules/user/testing';
import { courseEntityFactory } from '@modules/course/testing';
import { schoolFactory } from '@modules/school/testing';
import { RoleDto, RoleName } from '@modules/role';
import { ShareTokenPermissionService } from './share-token-permission.service';
import { ShareTokenContext, ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';
import { setupEntities } from '@testing/database';
import { User } from '@modules/user/repo';
import { CourseEntity } from '@modules/course/repo';
import { SchoolEntity } from '@modules/school/repo';

describe('ShareTokenPermissionService', () => {
	let service: ShareTokenPermissionService;
	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ShareTokenPermissionService,
				{ provide: AuthorizationService, useValue: createMock<AuthorizationService>() },
				{ provide: CourseService, useValue: createMock<CourseService>() },
				{ provide: RoomMembershipService, useValue: createMock<RoomMembershipService>() },
				{ provide: SchoolService, useValue: createMock<SchoolService>() },
			],
		}).compile();

		service = module.get(ShareTokenPermissionService);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseService);
		roomMembershipService = module.get(RoomMembershipService);
		schoolService = module.get(SchoolService);

		await setupEntities([User, CourseEntity, SchoolEntity]);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('checkFeatureEnabled', () => {
		const setup = () => {
			jest.spyOn(Configuration, 'get').mockImplementation((key) => {
				if (key === 'FEATURE_COURSE_SHARE') return false;
				if (key === 'FEATURE_LESSON_SHARE') return false;
				if (key === 'FEATURE_TASK_SHARE') return false;
				if (key === 'FEATURE_COLUMN_BOARD_SHARE') return false;
				if (key === 'FEATURE_ROOMS_ENABLED') return false;
				return true;
			});
		};
		it('should throw FeatureDisabledLoggableException if feature is disabled for Course', () => {
			setup();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Course)).toThrow(FeatureDisabledLoggableException);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for Lesson', () => {
			setup();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Lesson)).toThrow(FeatureDisabledLoggableException);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for Task', () => {
			setup();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Task)).toThrow(FeatureDisabledLoggableException);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for ColumnBoard', () => {
			setup();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.ColumnBoard)).toThrow(
				FeatureDisabledLoggableException
			);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for Room', () => {
			setup();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Room)).toThrow(FeatureDisabledLoggableException);
		});

		it('should not throw if feature is enabled', () => {
			jest.spyOn(Configuration, 'get').mockReturnValue(true);

			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Course)).not.toThrow();
		});

		it('should throw NotImplementedException for unsupported parent types', () => {
			expect(() => service.checkFeatureEnabled('UnsupportedType' as ShareTokenParentType)).toThrow(
				NotImplementedException
			);
		});
	});

	describe('checkCourseWritePermission', () => {
		const setup = () => {
			const user = userFactory.asTeacher().build();
			const course = courseEntityFactory.buildWithId();
			courseService.findById.mockResolvedValueOnce(course);

			return { user, course };
		};

		it('should call courseService.findById', async () => {
			const { user, course } = setup();

			await service.checkCourseWritePermission(user, course.id, Permission.COURSE_EDIT);

			expect(courseService.findById).toHaveBeenCalledWith(course.id);
		});

		it('should check permission', async () => {
			const { user, course } = setup();
			await service.checkCourseWritePermission(user, 'course-id', Permission.COURSE_EDIT);

			expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, course, expect.anything());
		});

		it('should return course entity', async () => {
			const { user, course } = setup();

			const result = await service.checkCourseWritePermission(user, 'course-id', Permission.COURSE_EDIT);

			expect(result).toEqual({ course });
		});
	});

	describe('checkRoomWritePermission', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const permissions = [Permission.ROOM_EDIT];

			const roleDto: RoleDto = {
				id: 'role-id',
				name: RoleName.TEACHER,
				permissions,
			};
			const members: UserWithRoomRoles[] = [
				{
					roles: [roleDto],
					userId: user.id,
				},
			];
			const roomMembershipAuthorizable = new RoomMembershipAuthorizable('room-id', members, 'school-id');
			roomMembershipService.getRoomMembershipAuthorizable.mockResolvedValueOnce(roomMembershipAuthorizable);

			return { user, roomMembershipAuthorizable, permissions };
		};

		it('should call roomMembershipService.getRoomMembershipAuthorizable', async () => {
			const { user, permissions } = setup();

			await service.checkRoomWritePermission(user, 'room-id', permissions);

			expect(roomMembershipService.getRoomMembershipAuthorizable).toHaveBeenCalledWith('room-id');
		});

		it('should check permission', async () => {
			const { user, roomMembershipAuthorizable, permissions } = setup();

			await service.checkRoomWritePermission(user, 'room-id', permissions);

			const authorizationContext = AuthorizationContextBuilder.write(permissions);
			expect(authorizationService.checkPermission).toHaveBeenCalledWith(
				user,
				roomMembershipAuthorizable,
				authorizationContext
			);
		});
	});

	describe('checkContextReadPermission', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

			const school = schoolFactory.build();
			schoolService.getSchoolById.mockResolvedValueOnce(school);

			const context: ShareTokenContext = { contextType: ShareTokenContextType.School, contextId: school.id };

			return { user, context, school };
		};

		it('should get user with permissions', async () => {
			const { user, context } = setup();

			await service.checkContextReadPermission(user.id, context);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
		});

		it('should throw NotImplementedException for unsupported context types', async () => {
			const context = { contextType: 'UnsupportedType', contextId: 'id' } as unknown as ShareTokenContext;

			await expect(service.checkContextReadPermission('user-id', context)).rejects.toThrow(NotImplementedException);
		});

		it('should call schoolService.getSchoolById', async () => {
			const { user, context, school } = setup();

			await service.checkContextReadPermission(user.id, context);

			expect(schoolService.getSchoolById).toHaveBeenCalledWith(school.id);
		});

		it('should check permission with read context', async () => {
			const { user, context, school } = setup();

			await service.checkContextReadPermission(user.id, context);

			expect(authorizationService.checkPermission).toHaveBeenCalledWith(
				user,
				school,
				AuthorizationContextBuilder.read([])
			);
		});
	});
});
