import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	materialFactory,
} from '@shared/testing';
import {
	ComponentEtherpadProperties,
	ComponentGeogebraProperties,
	ComponentInternalProperties,
	ComponentLernstoreProperties,
	ComponentNexboardProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
} from '@shared/domain/entity';
import { LessonResponse } from '../dto';

describe('Lesson Controller (API) - GET /lessons/:lessonId', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, '/lessons');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when user is a valid teacher', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.buildWithId({ teachers: [teacherUser] });
			const material = materialFactory.buildWithId();
			const lesson = lessonFactory.build({ course, materials: [material] });
			const hiddenLesson = lessonFactory.build({ course, hidden: true });
			await em.persistAndFlush([teacherAccount, teacherUser, course, material, lesson, hiddenLesson]);

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, lesson, hiddenLesson };
		};
		it('should return the lesson', async () => {
			const { loggedInClient, lesson } = await setup();
			const response = await loggedInClient.get(`${lesson.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			expect(body._id).toEqual(lesson.id);
			expect(body.name).toEqual(lesson.name);
		});
		it('should return a hidden lessons', async () => {
			const { loggedInClient, hiddenLesson } = await setup();
			const response = await loggedInClient.get(hiddenLesson.id);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			expect(body._id).toEqual(hiddenLesson.id);
			expect(body.name).toEqual(hiddenLesson.name);
		});
		it('should return lesson with materials', async () => {
			const { loggedInClient, lesson } = await setup();
			const response = await loggedInClient.get(`${lesson.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			expect(body.materials).toHaveLength(1);
			expect(body.materials[0]._id).toEqual(lesson.materials[0].id);
		});
	});

	describe('when lesson has contents', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.buildWithId({ teachers: [teacherUser] });

			const userId = new ObjectId().toHexString();
			const contents = { title: 'title', hidden: false, user: userId };

			const contentText: ComponentTextProperties = { text: 'text (ck4) content' };
			const lessonWithText = lessonFactory.build({
				course,
				contents: [{ ...contents, component: ComponentType.TEXT, content: contentText }],
			});

			const contentGeogebra: ComponentGeogebraProperties = { materialId: 'geogebraId' };
			const lessonWithGeogebra = lessonFactory.build({
				course,
				contents: [{ ...contents, component: ComponentType.GEOGEBRA, content: contentGeogebra }],
			});

			const contentEtherpad: ComponentEtherpadProperties = {
				title: 'etherpad',
				description: 'etherpad description',
				url: 'etherpadUrl',
			};
			const lessonWithEtherpad = lessonFactory.build({
				course,
				contents: [{ ...contents, component: ComponentType.ETHERPAD, content: contentEtherpad }],
			});

			const contentInternal: ComponentInternalProperties = { url: 'internalUrl' };
			const lessonWithInternal = lessonFactory.build({
				course,
				contents: [{ ...contents, component: ComponentType.INTERNAL, content: contentInternal }],
			});

			const contentLernstore: ComponentLernstoreProperties = {
				resources: [
					{
						client: 'client',
						description: 'lernstore description',
						title: 'lernstore title',
						url: 'lernstoreUrl',
					},
				],
			};
			const lessonWithLernstore = lessonFactory.build({
				course,
				contents: [{ ...contents, component: ComponentType.LERNSTORE, content: contentLernstore }],
			});

			const contentNexboard: ComponentNexboardProperties = {
				title: 'nexboard content',
				url: 'nexboardUrl',
				board: 'nexboard',
				description: 'nexboard description',
			};
			const lessonWithNexboard = lessonFactory.build({
				course,
				contents: [{ ...contents, component: ComponentType.NEXBOARD, content: contentNexboard }],
			});

			await em.persistAndFlush([
				teacherAccount,
				teacherUser,
				course,
				lessonWithText,
				lessonWithGeogebra,
				lessonWithEtherpad,
				lessonWithInternal,
				lessonWithLernstore,
				lessonWithNexboard,
			]);

			const loggedInClient = await testApiClient.login(teacherAccount);

			return {
				loggedInClient,
				lessonWithText,
				lessonWithGeogebra,
				lessonWithEtherpad,
				lessonWithInternal,
				lessonWithLernstore,
				lessonWithNexboard,
				contentText,
				contentGeogebra,
				contentEtherpad,
				contentInternal,
				contentLernstore,
				contentNexboard,
			};
		};

		it('should not return user Id', async () => {
			const { loggedInClient, lessonWithText } = await setup();
			const response = await loggedInClient.get(`${lessonWithText.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			expect((body.contents[0] as ComponentProperties).user).toBeUndefined();
		});

		it('should return lesson with text contents', async () => {
			const { loggedInClient, lessonWithText, contentText } = await setup();
			const response = await loggedInClient.get(`${lessonWithText.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			const componentProps = body.contents[0] as ComponentProperties;
			expect(componentProps.component).toEqual(ComponentType.TEXT);
			expect(componentProps.content).toEqual(contentText);
		});
		it('should return lesson with Geogebra contents', async () => {
			const { loggedInClient, lessonWithGeogebra, contentGeogebra } = await setup();

			const response = await loggedInClient.get(`${lessonWithGeogebra.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			const componentProps = body.contents[0] as ComponentProperties;
			expect(componentProps.component).toEqual(ComponentType.GEOGEBRA);
			expect(componentProps.content).toEqual(contentGeogebra);
		});
		it('should return lesson with Etherpad contents', async () => {
			const { loggedInClient, lessonWithEtherpad, contentEtherpad } = await setup();

			const response = await loggedInClient.get(`${lessonWithEtherpad.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			const componentProps = body.contents[0] as ComponentProperties;
			expect(componentProps.component).toEqual(ComponentType.ETHERPAD);
			expect(componentProps.content).toEqual(contentEtherpad);
		});
		it('should return lesson with Internal contents', async () => {
			const { loggedInClient, lessonWithInternal, contentInternal } = await setup();

			const response = await loggedInClient.get(`${lessonWithInternal.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			const componentProps = body.contents[0] as ComponentProperties;
			expect(componentProps.component).toEqual(ComponentType.INTERNAL);
			expect(componentProps.content).toEqual(contentInternal);
		});
		it('should return lesson with Lernstore contents', async () => {
			const { loggedInClient, lessonWithLernstore, contentLernstore } = await setup();

			const response = await loggedInClient.get(`${lessonWithLernstore.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			const componentProps = body.contents[0] as ComponentProperties;
			expect(componentProps.component).toEqual(ComponentType.LERNSTORE);
			expect(componentProps.content).toEqual(contentLernstore);
		});
		it('should return lesson with Nexboard contents', async () => {
			const { loggedInClient, lessonWithNexboard, contentNexboard } = await setup();

			const response = await loggedInClient.get(`${lessonWithNexboard.id}`);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;
			const componentProps = body.contents[0] as ComponentProperties;
			expect(componentProps.component).toEqual(ComponentType.NEXBOARD);
			expect(componentProps.content).toEqual(contentNexboard);
		});
	});

	describe('when user is a valid student', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.buildWithId({ students: [studentUser] });
			const lesson = lessonFactory.build({ course });
			const hiddenLesson = lessonFactory.build({ course, hidden: true });

			await em.persistAndFlush([studentAccount, studentUser, course, lesson, hiddenLesson]);

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, lesson, hiddenLesson };
		};
		it('should return lesson', async () => {
			const { loggedInClient, lesson } = await setup();
			const response = await loggedInClient.get(lesson.id);
			expect(response.status).toBe(HttpStatus.OK);

			const body = response.body as LessonResponse;

			expect(body._id).toEqual(lesson.id);
			expect(body.name).toEqual(lesson.name);
		});
		it('should not return hidden lesson', async () => {
			const { loggedInClient, hiddenLesson } = await setup();

			const response = await loggedInClient.get(hiddenLesson.id);
			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});

	describe('when user is not authorized', () => {
		const setup = async () => {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const course = courseFactory.buildWithId({ students: [] });
			const lesson = lessonFactory.build({ course });
			await em.persistAndFlush([studentAccount, studentUser, course, lesson]);

			const loggedInClient = await testApiClient.login(studentAccount);

			return { loggedInClient, course, lesson };
		};
		it('should return status 404', async () => {
			const { loggedInClient, lesson } = await setup();
			const response = await loggedInClient.get(lesson.id);
			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});

	describe('when lesson belongs to a courseGroup', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseFactory.buildWithId({ teachers: [teacherUser] });
			const courseGroup = courseGroupFactory.buildWithId({ course });
			const lesson = lessonFactory.build({ courseGroup });
			await em.persistAndFlush([teacherAccount, teacherUser, course, courseGroup, lesson]);

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, lesson, courseGroup };
		};
		it('should return lesson with courseGroup id', async () => {
			const { loggedInClient, lesson, courseGroup } = await setup();
			const response = await loggedInClient.get(lesson.id);
			expect(response.status).toBe(HttpStatus.OK);
			const body = response.body as LessonResponse;
			expect(body.courseGroupId).toEqual(courseGroup.id);
		});
	});
});
