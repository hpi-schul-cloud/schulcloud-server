import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { RoleDto, RoleName } from '@modules/role';
import { RoomAuthorizable, RoomMembershipService, UserWithRoomRoles } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { SchoolEntity } from '@modules/school/repo';
import { schoolFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ShareTokenContext, ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';
import { SHARING_PUBLIC_API_CONFIG_TOKEN, SharingPublicApiConfig } from '../../sharing.config';
import { ShareTokenPermissionService } from './share-token-permission.service';

describe('ShareTokenPermissionService', () => {
	let service: ShareTokenPermissionService;
	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseService>;
	let roomMembershipService: DeepMocked<RoomMembershipService>;
	let schoolService: DeepMocked<SchoolService>;
	let config: SharingPublicApiConfig;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ShareTokenPermissionService,
				{ provide: AuthorizationService, useValue: createMock<AuthorizationService>() },
				{ provide: CourseService, useValue: createMock<CourseService>() },
				{ provide: RoomMembershipService, useValue: createMock<RoomMembershipService>() },
				{ provide: SchoolService, useValue: createMock<SchoolService>() },
				{
					provide: SHARING_PUBLIC_API_CONFIG_TOKEN,
					useValue: {
						featureCourseShare: false,
						featureLessonShare: false,
						featureTaskShare: false,
						featureColumnBoardShare: false,
						featureRoomShare: false,
					},
				},
			],
		}).compile();

		service = module.get(ShareTokenPermissionService);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseService);
		roomMembershipService = module.get(RoomMembershipService);
		schoolService = module.get(SchoolService);
		config = module.get<SharingPublicApiConfig>(SHARING_PUBLIC_API_CONFIG_TOKEN);

		await setupEntities([User, CourseEntity, SchoolEntity]);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('checkFeatureEnabled', () => {
		it('should throw FeatureDisabledLoggableException if feature is disabled for Course', () => {
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Course)).toThrow(FeatureDisabledLoggableException);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for Lesson', () => {
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Lesson)).toThrow(FeatureDisabledLoggableException);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for Task', () => {
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Task)).toThrow(FeatureDisabledLoggableException);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for ColumnBoard', () => {
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.ColumnBoard)).toThrow(
				FeatureDisabledLoggableException
			);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for Card', () => {
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Card)).toThrow(FeatureDisabledLoggableException);
		});

		it('should throw FeatureDisabledLoggableException if feature is disabled for Room', () => {
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Room)).toThrow(FeatureDisabledLoggableException);
		});

		it('should not throw if feature is enabled', () => {
			config.featureCourseShare = true;
			config.featureLessonShare = true;
			config.featureTaskShare = true;
			config.featureColumnBoardShare = true;
			config.featureRoomShare = true;

			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Course)).not.toThrow();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Lesson)).not.toThrow();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Task)).not.toThrow();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.ColumnBoard)).not.toThrow();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Card)).not.toThrow();
			expect(() => service.checkFeatureEnabled(ShareTokenParentType.Room)).not.toThrow();
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
			const permissions = [Permission.ROOM_EDIT_ROOM];

			const roleDto: RoleDto = {
				id: 'role-id',
				name: RoleName.TEACHER,
				permissions,
			};
			const members: UserWithRoomRoles[] = [
				{
					roles: [roleDto],
					userId: user.id,
					userSchoolId: 'school-id',
				},
			];
			const roomAuthorizable = new RoomAuthorizable('room-id', members, 'school-id');
			roomMembershipService.getRoomAuthorizable.mockResolvedValueOnce(roomAuthorizable);

			return { user, roomAuthorizable, permissions };
		};

		it('should call roomMembershipService.getRoomAuthorizable', async () => {
			const { user, permissions } = setup();

			await service.checkRoomWritePermission(user, 'room-id', permissions);

			expect(roomMembershipService.getRoomAuthorizable).toHaveBeenCalledWith('room-id');
		});

		it('should check permission', async () => {
			const { user, roomAuthorizable, permissions } = setup();

			await service.checkRoomWritePermission(user, 'room-id', permissions);

			const authorizationContext = AuthorizationContextBuilder.write(permissions);
			expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, roomAuthorizable, authorizationContext);
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
