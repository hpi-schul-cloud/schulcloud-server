import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { cleanupCollections } from '@testing/cleanup-collections';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { classEntityFactory } from '@modules/class/entity/testing';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { schoolNewsFactory } from '@modules/news/testing';
import { ComponentProperties, ComponentType } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { externalToolPseudonymEntityFactory } from '@modules/pseudonym/testing';
import { SchoolEntity } from '@modules/school/repo';
import { CourseEntity } from '@modules/course/repo';
import { mediaBoardEntityFactory } from '@modules/board/testing';
import { BoardExternalReferenceType } from '@modules/board';
import { BoardNodeEntity } from '@modules/board/repo';
import { submissionFactory, taskFactory } from '@modules/task/testing';
import { Submission, Task } from '@modules/task/repo';
import { ExternalToolPseudonymEntity } from '@modules/pseudonym/entity';
import { AccountEntity } from '@modules/account/repo';
import { User } from '@modules/user/repo';
import { registrationPinEntityFactory } from '@modules/registration-pin/entity/testing';
import { fileEntityFactory } from '@modules/files/entity/testing';
import { FileOwnerModel } from '@modules/files/domain';
import { RegistrationPinEntity } from '@modules/registration-pin/entity';
import { FileEntity } from '@modules/files/entity';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FilesStorageProducer } from '@modules/files-storage-client/service';
import { CalendarService } from '@infra/calendar';
import { RocketChatService } from '@modules/rocketchat/rocket-chat.service';
import { FileDO, FileRecordParentType, ScanStatus } from '@infra/rabbitmq';
import { rocketChatUserEntityFactory } from '@modules/rocketchat-user/entity/testing';

const baseRouteName = '/deletionExecutions';

describe(`deletionExecution (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';
	let filesStorageProducer: DeepMocked<FilesStorageProducer>;
	let calendarService: DeepMocked<CalendarService>;
	let rocketChatService: DeepMocked<RocketChatService>;

	beforeAll(async () => {
		const config = adminApiServerConfig();
		config.ADMIN_API__ALLOWED_API_KEYS = [API_KEY];
		config.CALENDAR_SERVICE_ENABLED = true;

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

				await em.persistAndFlush(deletionRequest);
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

				const lessonContent: ComponentProperties = {
					title: 'title',
					hidden: false,
					user: new ObjectId(teacherUser.id),
					component: ComponentType.TEXT,
					content: { text: 'test of content' },
				};
				const lesson = lessonFactory.buildWithId({ contents: [lessonContent] });
				const news = schoolNewsFactory.buildWithId({ creator: teacherUser, school: school.id });
				const pseudonym = externalToolPseudonymEntityFactory.buildWithId({ userId: studentUser.id });

				const mediaBoard = mediaBoardEntityFactory.build({
					context: {
						id: studentUser.id,
						type: BoardExternalReferenceType.User,
					},
				});

				const task = taskFactory.buildWithId({
					creator: teacherUser,
					school,
				});

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

				await em.persistAndFlush([
					school,
					teacherUser,
					teacherAccount,
					studentUser,
					studentAccount,
					course,
					schoolClass,
					courseGroup,
					file,
					lesson,
					news,
					pseudonym,
					mediaBoard,
					task,
					submission,
					groupSubmission,
					registrationPin,
					rocketChatUser,
				]);
				em.clear();

				const deletionRequestsTeacher = deletionRequestEntityFactory.build({
					targetRefId: teacherUser.id,
				});

				const deletionRequestsStudent = deletionRequestEntityFactory.build({
					targetRefId: studentUser.id,
				});

				await em.persistAndFlush([deletionRequestsTeacher, deletionRequestsStudent]);

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
					lesson,
					news,
					pseudonym,
					mediaBoard,
					task,
					submission,
					groupSubmission,
					registrationPin,
					file,
					rocketChatUser,
				};
			};

			it('should remove user and any user references and return status 204', async () => {
				const {
					deletionRequestIds,
					teacherUser,
					teacherAccount,
					course,
					studentUser,
					studentAccount,
					news,
					courseGroup,
					lesson,
					schoolClass,
					mediaBoard,
					pseudonym,
					task,
					submission,
					groupSubmission,
					rocketChatUser,
				} = await setup();

				const teacherId = new ObjectId(teacherUser.id);
				const studentId = new ObjectId(studentUser.id);
				const whereAccountTeacher = { id: teacherAccount.id, userId: teacherId };
				const whereAccountStudent = { id: studentAccount.id, userId: studentId };
				const whereCourseTeacher = { id: course.id, teacherIds: { $in: [teacherId] } };
				const whereCourseStudent = { id: course.id, userIds: { $in: [studentId] } };
				const whereCourseGroup = { id: courseGroup.id, studentIds: { $in: [studentId] } };
				const whereSchoolClass = { id: schoolClass.id, teacherIds: { $in: [teacherId] } };
				const whereLesson = { id: lesson.id, contents: { $elemMatch: { user: teacherId } } };
				const whereNews = { id: news.id, creator: teacherId };
				const wherePseudonym = { id: pseudonym.id, userId: studentId };
				const whereTask = { id: task.id, creator: teacherId };
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

				const checkcourseBefore = await em.findOne(CourseEntity, whereCourseTeacher);
				expect(checkcourseBefore).not.toBeNull();

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

				const checkNews = await em.findOne(SchoolEntity, whereNews);
				expect(checkNews).toBeNull();

				const checkLesson = await em.findOne(CourseEntity, whereLesson);
				expect(checkLesson).toBeNull();

				const checkMediaBoard = await em.findOne(BoardNodeEntity, mediaBoard.id);
				expect(checkMediaBoard).toBeNull();

				const checkPseudonym = await em.findOne(ExternalToolPseudonymEntity, wherePseudonym);
				expect(checkPseudonym).toBeNull();

				const checkTask = await em.findOne(Task, whereTask);
				expect(checkTask).toBeNull();

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

			await em.persistAndFlush(deletionRequest);
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
