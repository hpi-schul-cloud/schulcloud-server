import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { LessonClientAdapter } from './lesson-client.adapter';
import { LessonApi, LessonLinkedTaskResponse, LessonResponse } from './lessons-api-client';

describe(LessonClientAdapter.name, () => {
	let module: TestingModule;
	let sut: LessonClientAdapter;
	let lessonApiMock: DeepMocked<LessonApi>;
	const jwtToken = faker.string.alphanumeric(20);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LessonClientAdapter,
				{
					provide: LessonApi,
					useValue: createMock<LessonApi>(),
				},
				{
					provide: REQUEST,
					useValue: createMock<Request>({
						headers: {
							authorization: `Bearer ${jwtToken}`,
						},
					}),
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
		describe('When getLessonById is called', () => {
			const setup = () => {
				const lessonId = faker.string.uuid();
				const linkedTasks = createMock<AxiosResponse<LessonLinkedTaskResponse[]>>({
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
								merlinReference: faker.lorem.sentence(),
							},
						],
					},
				});

				lessonApiMock.lessonControllerGetLessonTasks.mockResolvedValue(linkedTasks);
				lessonApiMock.lessonControllerGetLesson.mockResolvedValue(response);

				return { lessonId: response.data.id };
			};

			it('should call lessonControllerGetLesson', async () => {
				const { lessonId } = setup();

				await sut.getLessonById(lessonId);

				expect(lessonApiMock.lessonControllerGetLesson).toHaveBeenCalled();
			});
		});

		describe('When getLessonById is called with invalid id', () => {
			const setup = () => {
				const lessonResponseId = faker.string.uuid();

				lessonApiMock.lessonControllerGetLesson.mockRejectedValueOnce(new Error('error'));

				return { lessonResponseId };
			};

			it('should throw an error', async () => {
				const { lessonResponseId } = setup();

				const result = sut.getLessonById(lessonResponseId);

				await expect(result).rejects.toThrowError('error');
			});
		});

		describe('When no JWT token is found', () => {
			const setup = () => {
				const lessonResponseId = faker.string.uuid();
				const request = createMock<Request>({
					headers: {},
				}) as Request;

				const adapter: LessonClientAdapter = new LessonClientAdapter(lessonApiMock, request);

				return { lessonResponseId, adapter };
			};

			it('should throw an UnauthorizedError', async () => {
				const { lessonResponseId, adapter } = setup();

				await expect(adapter.getLessonById(lessonResponseId)).rejects.toThrowError(UnauthorizedException);
			});
		});
	});
});
