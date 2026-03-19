import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { LessonApi, LessonLinkedTaskResponse, LessonResponse } from '../generated';
import { LessonClientAdapter } from './lesson-client.adapter';

describe(LessonClientAdapter.name, () => {
	let module: TestingModule;
	let sut: LessonClientAdapter;
	let lessonApiMock: DeepMocked<LessonApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LessonClientAdapter,
				{
					provide: LessonApi,
					useValue: createMock<LessonApi>(),
				},
			],
		}).compile();

		sut = module.get(LessonClientAdapter);
		lessonApiMock = module.get(LessonApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('getLessonById', () => {
		describe('When called with correct id', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const lessonId = faker.string.uuid();
				const response = createMock<AxiosResponse<LessonResponse>>({
					data: {
						_id: faker.string.uuid(),
						id: lessonId,
						name: faker.lorem.sentence(),
						courseId: faker.string.uuid(),
						courseGroupId: faker.string.uuid(),
						hidden: faker.datatype.boolean(),
						position: faker.number.int(),
						contents: [
							{
								content: { text: faker.lorem.sentence() },
								_id: faker.string.uuid(),
								id: faker.string.uuid(),
								title: faker.lorem.sentence(),
								component: faker.helpers.arrayElement(['Etherpad', 'geoGebra']),
								hidden: faker.datatype.boolean(),
							},
						],
						materials: [
							{
								_id: faker.string.uuid(),
								id: faker.string.uuid(),
								title: faker.lorem.sentence(),
								relatedResources: [faker.lorem.sentence()],
								url: faker.internet.url(),
								client: faker.lorem.sentence(),
								license: [faker.lorem.sentence()],
							},
						],
					},
				});

				lessonApiMock.lessonControllerGetLesson.mockResolvedValue(response);

				return { lessonId: response.data.id, jwt };
			};

			it('should call lessonControllerGetLesson', async () => {
				const { lessonId, jwt } = setup();

				await sut.getLessonById(jwt, lessonId);

				expect(lessonApiMock.lessonControllerGetLesson).toHaveBeenCalled();
			});
		});

		describe('When called with invalid id', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const lessonResponseId = faker.string.uuid();

				lessonApiMock.lessonControllerGetLesson.mockRejectedValueOnce(new Error('error'));

				return { lessonResponseId, jwt };
			};

			it('should throw an error', async () => {
				const { lessonResponseId, jwt } = setup();

				const result = sut.getLessonById(jwt, lessonResponseId);

				await expect(result).rejects.toThrowError('error');
			});
		});
	});

	describe('getLessonTasks', () => {
		describe('When called with correct id', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();

				const lessonId = faker.string.uuid();
				const lessonTasks = createMock<AxiosResponse<LessonLinkedTaskResponse[]>>({
					data: [
						{
							name: faker.lorem.sentence(),
							description: faker.lorem.sentence(),
							descriptionInputFormat: faker.helpers.arrayElement(['plainText', 'richTextCk4', 'richTextCk5Simple']),
							availableDate: faker.date.recent().toString(),
							dueDate: faker.date.future().toString(),
							private: faker.datatype.boolean(),
							publicSubmissions: faker.datatype.boolean(),
							teamSubmissions: faker.datatype.boolean(),
						},
					],
				});

				lessonApiMock.lessonControllerGetLessonTasks.mockResolvedValue(lessonTasks);

				return { lessonId, jwt };
			};

			it('should call lessonControllerGetLessonTasks', async () => {
				const { lessonId, jwt } = setup();

				await sut.getLessonTasks(jwt, lessonId);

				expect(lessonApiMock.lessonControllerGetLessonTasks).toHaveBeenCalled();
			});
		});

		describe('When getLessonById is called with invalid id', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const lessonResponseId = faker.string.uuid();

				lessonApiMock.lessonControllerGetLessonTasks.mockRejectedValueOnce(new Error('error'));

				return { lessonResponseId, jwt };
			};

			it('should throw an error', async () => {
				const { lessonResponseId, jwt } = setup();

				const result = sut.getLessonTasks(jwt, lessonResponseId);

				await expect(result).rejects.toThrowError('error');
			});
		});
	});
});
