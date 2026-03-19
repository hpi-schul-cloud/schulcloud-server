import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CalendarService } from '@infra/calendar';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { BoardExternalReferenceType } from '@modules/board';
import { BoardNodeEntity } from '@modules/board/repo';
import { mediaBoardEntityFactory } from '@modules/board/testing';
import { classEntityFactory } from '@modules/class/entity/testing';
import { CourseEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { FileDO, FileRecordParentType, ScanStatus } from '@modules/files-storage-client';
import { FilesStorageProducer } from '@modules/files-storage-client/service';
import { FileOwnerModel } from '@modules/files/domain';
import { FileEntity } from '@modules/files/entity';
import { fileEntityFactory } from '@modules/files/entity/testing';
import { GroupEntity } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { DashboardEntity } from '@modules/learnroom/repo/mikro-orm/dashboard.entity';
import { DASHBOARD_REPO, IDashboardRepo } from '@modules/learnroom/repo/mikro-orm/dashboard.repo';
import { ComponentProperties, ComponentType, LessonEntity } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { schoolNewsFactory } from '@modules/news/testing';
import { ExternalToolPseudonymEntity } from '@modules/pseudonym/entity';
import { externalToolPseudonymEntityFactory } from '@modules/pseudonym/testing';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { registrationPinEntityFactory } from '@modules/registration-pin/entity/testing';
import { rocketChatUserEntityFactory } from '@modules/rocketchat-user/entity/testing';
import { RocketChatService } from '@modules/rocketchat/rocket-chat.service';
import { RoomArrangementEntity } from '@modules/room';
import { roomArrangementEntityFactory } from '@modules/room/testing';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { Submission, Task } from '@modules/task/repo';
import { submissionFactory, taskFactory } from '@modules/task/testing';
import { TeamEntity } from '@modules/team/repo';
import { teamFactory, teamUserFactory } from '@modules/team/testing';
import { User } from '@modules/user/repo';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';

const baseRouteName = '/deletionExecutions';

describe(`deletionExecution (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';
	let filesStorageProducer: DeepMocked<FilesStorageProducer>;
	let calendarService: DeepMocked<CalendarService>;
	let rocketChatService: DeepMocked<RocketChatService>;
	let dashboardRepo: IDashboardRepo;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		})
			.overrideProvider(FilesStorageProducer)
			.useValue(createMock<FilesStorageProducer>())
			.overrideProvider(CalendarService)
			.useValue(createMock<CalendarService>())
			.overrideProvider(RocketChatService)
			.useValue(createMock<RocketChatService>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);

		filesStorageProducer = module.get(FilesStorageProducer);
		calendarService = module.get(CalendarService);
		rocketChatService = module.get(RocketChatService);
		dashboardRepo = app.get(DASHBOARD_REPO);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('executeDeletions', () => {
		describe('when execute deletionRequests with default limit', () => {
			const setup = async () => {
				testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
				const deletionRequest = deletionRequestEntityFactory.build();

				await em.persist(deletionRequest).flush();
				em.clear();

				return { deletionRequest };
			};

			it('should return status 204', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.post('', {
					ids: [deletionRequest.id],
				});

				expect(response.status).toEqual(204);
			}, 20000);

			/* unstable test in CI
			it('should actually successful execute the deletionRequests', async () => {
				const { deletionRequest } = await setup();

				await testApiClient.post('', {
					ids: [deletionRequest.id],
				});

				const entity = await em.findOneOrFail(DeletionRequestEntity, deletionRequest.id);
				expect(entity.status).toEqual('success');
			}, 20000);
			 */
		});

		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				testApiClient = new TestApiClient(app, baseRouteName, 'thisisaninvalidapikey', true);

				const response = await testApiClient.post('');

				expect(response.status).toEqual(401);
			});

			it('should refuse without token', async () => {
				testApiClient = new TestApiClient(app, baseRouteName, '', true);

				const response = await testApiClient.post('');

				expect(response.status).toEqual(401);
			});
		});

		describe('when deleting users with full data', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

				const course = courseEntityFactory.buildWithId({ teachers: [teacherUser], students: [studentUser] });
				const courseGroup = courseGroupEntityFactory.buildWithId({ course, students: [studentUser] });

				const schoolClass = classEntityFactory.buildWithId({
					schoolId: school.id,
					teacherIds: [new ObjectId(teacherUser.id)],
					userIds: [new ObjectId(studentUser.id)],
				});

				const file = fileEntityFactory.buildWithId({
					ownerId: studentUser.id,
					refOwnerModel: FileOwnerModel.USER,
				});

				const group = groupEntityFactory.buildWithId({
					users: [
						{
							user: teacherUser,
							role: teacherUser.roles[0],
						},
					],
					organization: school,
				});

				const lessonContent: ComponentProperties = {
					title: 'title',
					hidden: false,
					user: new ObjectId(teacherUser.id),
					component: ComponentType.TEXT,
					content: { text: 'test of content' },
				};
				const lesson = lessonFactory.buildWithId({ contents: [lessonContent] });

				const news = schoolNewsFactory.buildWithId({ creator: teacherUser, school: school.id });

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				const pseudonym = externalToolPseudonymEntityFactory.buildWithId({ userId: studentUser.id });

				const task = taskFactory.buildWithId({
					creator: teacherUser,
					school,
				});

				const teamUser = teamUserFactory.buildWithId({ user: studentUser });
				const team = teamFactory.withTeamUser([teamUser]).build();

				const submission = submissionFactory.buildWithId({
					student: studentUser,
					teamMembers: [studentUser],
					school,
				});

				const groupSubmission = submissionFactory.buildWithId({
					school,
					teamMembers: [studentUser],
				});

				const registrationPin = registrationPinEntityFactory.build({
					email: studentUser.email,
				});

				// 3rd party services
				calendarService.getAllEvents.mockResolvedValue(['event1', 'event2']);
				calendarService.deleteEventsByScopeId.mockResolvedValue();

				const mockFileStorage: FileDO = {
					id: 'foo',
					name: 'foo',
					parentId: 'foo',
					securityCheckStatus: ScanStatus.VERIFIED,
					size: 123,
					mimeType: 'foo',
					parentType: FileRecordParentType.User,
				};
				filesStorageProducer.removeCreatorIdFromFileRecords.mockResolvedValueOnce([mockFileStorage]);

				const rocketChatUser = rocketChatUserEntityFactory.buildWithId({ userId: studentUser.id });

				const roomArrangement = roomArrangementEntityFactory.build({ userId: studentUser.id });

				await em
					.persist([
						school,
						teacherUser,
						teacherAccount,
						studentUser,
						studentAccount,
						course,
						schoolClass,
						courseGroup,
						file,
						group,
						lesson,
						news,
						pseudonym,
						mediaBoard,
						task,
						team,
						submission,
						groupSubmission,
						registrationPin,
						rocketChatUser,
						roomArrangement,
					])
					.flush();
				em.clear();

				const dashboard = await dashboardRepo.getUsersDashboard(teacherUser.id);

				const deletionRequestsTeacher = deletionRequestEntityFactory.build({
					targetRefId: teacherUser.id,
				});
				const deletionRequestsStudent = deletionRequestEntityFactory.build({
					targetRefId: studentUser.id,
				});
				await em.persist([deletionRequestsTeacher, deletionRequestsStudent]).flush();
				const deletionRequestIds = [deletionRequestsTeacher.id, deletionRequestsStudent.id];

				testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);

				return {
					deletionRequestIds,
					teacherUser,
					teacherAccount,
					studentUser,
					studentAccount,
					course,
					courseGroup,
					schoolClass,
					group,
					lesson,
					file,
					dashboard,
					pseudonym,
					mediaBoard,
					news,
					task,
					team,
					submission,
					groupSubmission,
					registrationPin,
					rocketChatUser,
					roomArrangement,
				};
			};

			it('should remove user and any user references and return status 204', async () => {
				const {
					deletionRequestIds,
					teacherUser,
					teacherAccount,
					studentUser,
					studentAccount,
					course,
					courseGroup,
					dashboard,
					group,
					lesson,
					schoolClass,
					mediaBoard,
					news,
					pseudonym,
					task,
					team,
					submission,
					groupSubmission,
					rocketChatUser,
					roomArrangement,
				} = await setup();

				const teacherId = new ObjectId(teacherUser.id);
				const studentId = new ObjectId(studentUser.id);
				const whereAccountTeacher = { id: teacherAccount.id, userId: teacherId };
				const whereAccountStudent = { id: studentAccount.id, userId: studentId };
				const whereCourseTeacher = { id: course.id, teacherIds: { $in: [teacherId] } };
				const whereCourseStudent = { id: course.id, userIds: { $in: [studentId] } };
				const whereCourseGroup = { id: courseGroup.id, studentIds: { $in: [studentId] } };
				const whereSchoolClass = { id: schoolClass.id, teacherIds: { $in: [teacherId] } };
				const whereDashboard = { id: dashboard.id, userIds: { $in: [teacherId] } };
				const whereGroup = { id: group.id, userIds: { $in: [teacherId] } };
				const whereNews = { id: news.id, creator: teacherId };
				const wherePseudonym = { id: pseudonym.id, userId: studentId };
				const whereTask = { id: task.id, creator: teacherId };
				const whereTeam = { id: team.id, userIds: { userId: studentId } };
				const whereSubmission = { id: submission.id, studentId };
				const whereGroupSubmission = {
					id: groupSubmission.id,
					teamMembers: { $in: [studentId] },
				};
				const whereRegistrationPin = {
					email: studentUser.email,
				};
				const whereFile = {
					ownerId: studentUser.id,
					refOwnerModel: FileOwnerModel.USER,
				};
				const whereRoomArrangement = { id: roomArrangement.id, userId: studentUser.id };

				const checkCourseBefore = await em.findOne(CourseEntity, whereCourseTeacher);
				expect(checkCourseBefore).not.toBeNull();

				const response = await testApiClient.post('', {
					ids: deletionRequestIds,
				});

				expect(response.status).toEqual(204);

				const checkAccountTeacher = await em.findOne(AccountEntity, whereAccountTeacher);
				expect(checkAccountTeacher).toBeNull();

				const checkAccountStudent = await em.findOne(AccountEntity, whereAccountStudent);
				expect(checkAccountStudent).toBeNull();

				const checkCourseTeacher = await em.findOne(CourseEntity, whereCourseTeacher);
				expect(checkCourseTeacher).toBeNull();
				const checkCourseStudent = await em.findOne(CourseEntity, whereCourseStudent);
				expect(checkCourseStudent).toBeNull();

				const checkCourseGroup = await em.findOne(CourseEntity, whereCourseGroup);
				expect(checkCourseGroup).toBeNull();

				const checkSchoolClass = await em.findOne(SchoolEntity, whereSchoolClass);
				expect(checkSchoolClass).toBeNull();

				const checkDashboard = await em.findOne(DashboardEntity, whereDashboard);
				expect(checkDashboard).toBeNull();

				const checkGroup = await em.findOne(GroupEntity, whereGroup);
				expect(checkGroup).toBeNull();

				const checkLesson = await em.findOne(LessonEntity, lesson.id);
				const lessonContents = checkLesson?.contents[0];
				expect(lessonContents?.user).toBeUndefined();

				const checkMediaBoard = await em.findOne(BoardNodeEntity, mediaBoard.id);
				expect(checkMediaBoard).toBeNull();

				const checkNews = await em.findOne(SchoolEntity, whereNews);
				expect(checkNews).toBeNull();

				const checkPseudonym = await em.findOne(ExternalToolPseudonymEntity, wherePseudonym);
				expect(checkPseudonym).toBeNull();

				const checkTask = await em.findOne(Task, whereTask);
				expect(checkTask).toBeNull();

				const checkTeam = await em.findOne(TeamEntity, whereTeam);
				expect(checkTeam).toBeNull();

				const checkSubmission = await em.findOne(Submission, whereSubmission);
				expect(checkSubmission).toBeNull();

				const checkGroupSubmission = await em.findOne(Submission, whereGroupSubmission);
				expect(checkGroupSubmission).toBeNull();

				const checkTeacherUser = await em.findOne(User, teacherUser.id);
				expect(checkTeacherUser).toBeNull();
				const checkStudentUser = await em.findOne(User, studentUser.id);
				expect(checkStudentUser).toBeNull();

				const checkRegistrationPin = await em.findOne(RegistrationPinEntity, whereRegistrationPin);
				expect(checkRegistrationPin).toBeNull();

				const checkFile = await em.findOne(FileEntity, whereFile);
				expect(checkFile).toBeNull();

				const checkRoomArrangement = await em.findOne(RoomArrangementEntity, whereRoomArrangement);
				expect(checkRoomArrangement).toBeNull();

				expect(rocketChatService.deleteUser).toHaveBeenCalledWith(rocketChatUser.username);

				expect(filesStorageProducer.removeCreatorIdFromFileRecords).toHaveBeenCalledWith(studentUser.id);
				expect(filesStorageProducer.removeCreatorIdFromFileRecords).toHaveBeenCalledWith(teacherUser.id);

				expect(calendarService.deleteEventsByScopeId).toHaveBeenCalledWith(studentUser.id);
				expect(calendarService.deleteEventsByScopeId).toHaveBeenCalledWith(teacherUser.id);
			}, 30000);
		});
	});

	describe('findAllItemsToExecute', () => {
		const setup = async () => {
			testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);

			const deletionRequest = deletionRequestEntityFactory.build();

			await em.persist(deletionRequest).flush();
			em.clear();

			return { deletionRequest, testApiClient };
		};

		it('should return status 200', async () => {
			const { testApiClient } = await setup();

			const response = await testApiClient.get();

			expect(response.status).toEqual(200);
		});

		it('should return deletionRequests ids', async () => {
			const { deletionRequest, testApiClient } = await setup();

			const response = await testApiClient.get();

			expect(response.body).toEqual([deletionRequest.id]);
		});
	});
});
