import { createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { FeathersAuthorizationService } from '@modules/authorization';
import { UnauthorizedException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { CreateNews, NewsTargetModel } from '@shared/domain/types';
import { NewsRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { NewsUc } from './news.uc';

describe('NewsUc', () => {
	let module: TestingModule;
	let service: NewsUc;
	let repo: NewsRepo;
	const courseTargetId = 'course1';
	const teamTargetId = 'team1';
	const NEWS_PERMISSIONS = [Permission.NEWS_VIEW, Permission.NEWS_EDIT];

	const userId = new ObjectId().toString();
	const schoolId = new ObjectId().toString();
	const newsId = new ObjectId().toString();
	const unpublishedNewsId = new ObjectId().toString();
	const displayAt = new Date();
	const displayAtFuture = new Date(Date.now() + 86400000);
	const exampleCourseNews = {
		_id: newsId,
		displayAt,
		updater: undefined,
		targetModel: NewsTargetModel.Course,
		target: {
			id: courseTargetId,
		},
	};
	const exampleUnpublishedCourseNews = {
		_id: unpublishedNewsId,
		displayAtFuture,
		targetModel: NewsTargetModel.Course,
		target: {
			id: courseTargetId,
		},
	};
	const pagination = {};

	const targets = [
		{
			targetModel: NewsTargetModel.Course,
			targetIds: [courseTargetId],
		},
		{
			targetModel: NewsTargetModel.Team,
			targetIds: [teamTargetId],
		},
	];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				NewsUc,
				{
					provide: NewsRepo,
					useValue: {
						save() {
							return {};
						},
						findAllPublished() {
							return [[exampleCourseNews], 1];
						},
						findAllUnpublishedByUser() {
							return [[exampleUnpublishedCourseNews], 1];
						},
						findOneById(id) {
							if (id === newsId) {
								return exampleCourseNews;
							}
							throw new NotFoundException();
						},
						delete() {},
					},
				},
				{
					provide: FeathersAuthorizationService,
					useValue: {
						checkEntityPermissions(user) {
							if (userId !== user) {
								throw new UnauthorizedException();
							}
						},
						// the method is not used anymore or?
						// eslint-disable-next-line @typescript-eslint/no-shadow
						getPermittedEntities(userId, targetModel) {
							return targets
								.filter((target) => target.targetModel === targetModel)
								.flatMap((target) => target.targetIds);
						},
						getEntityPermissions() {
							return NEWS_PERMISSIONS;
						},
					},
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(NewsUc);
		repo = module.get(NewsRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllPublishedByUser', () => {
		it('should search for news by empty scope ', async () => {
			const scope = {};
			const findAllSpy = jest.spyOn(repo, 'findAllPublished');
			await service.findAllForUser(userId, scope, pagination);
			const expectedParams = [targets, pagination];
			expect(findAllSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for school news with given school id', async () => {
			const scope = {
				target: {
					targetModel: NewsTargetModel.School,
					targetId: schoolId,
				},
			};
			const findAllBySchoolSpy = jest.spyOn(repo, 'findAllPublished');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], pagination];
			expect(findAllBySchoolSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for course news with given courseId', async () => {
			const scope = {
				target: {
					targetModel: NewsTargetModel.Course,
					targetId: courseTargetId,
				},
			};
			const findAllByCourseSpy = jest.spyOn(repo, 'findAllPublished');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], pagination];
			expect(findAllByCourseSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for all course news if course id is not given', async () => {
			const targetModel = NewsTargetModel.Course;
			const scope = { target: { targetModel } };
			const findAllByTargetSpy = jest.spyOn(repo, 'findAllPublished');
			await service.findAllForUser(userId, scope, pagination);
			const targetIds = targets
				.filter((target) => target.targetModel === targetModel)
				.flatMap((target) => target.targetIds);
			const expectedTarget = { targetModel, targetIds };
			const expectedParams = [[expectedTarget], pagination];
			expect(findAllByTargetSpy).toHaveBeenCalledWith(...expectedParams);
		});
	});

	describe('findAllUnpublishedByUser', () => {
		it('should search for news by empty scope', async () => {
			const scope = { unpublished: true };
			const findAllUnpublishedSpy = jest.spyOn(repo, 'findAllUnpublishedByUser');
			await service.findAllForUser(userId, scope, pagination);
			const expectedParams = [targets, userId, pagination];
			expect(findAllUnpublishedSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for school news with given school id', async () => {
			const scope = {
				unpublished: true,
				target: {
					targetModel: NewsTargetModel.School,
					targetId: schoolId,
				},
			};
			const findAllUnpublishedBySchoolSpy = jest.spyOn(repo, 'findAllUnpublishedByUser');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], userId, pagination];
			expect(findAllUnpublishedBySchoolSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for course news with given courseId', async () => {
			const scope = {
				unpublished: true,
				target: {
					targetModel: NewsTargetModel.Course,
					targetId: courseTargetId,
				},
			};
			const findAllUnpublishedByCourseSpy = jest.spyOn(repo, 'findAllUnpublishedByUser');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], userId, pagination];
			expect(findAllUnpublishedByCourseSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for all course news if course id is not given', async () => {
			const targetModel = NewsTargetModel.Course;
			const scope = { target: { targetModel }, unpublished: true };
			const findAllUnpublishedByTargetSpy = jest.spyOn(repo, 'findAllUnpublishedByUser');
			await service.findAllForUser(userId, scope, pagination);
			const targetIds = targets
				.filter((target) => target.targetModel === targetModel)
				.flatMap((target) => target.targetIds);
			const expectedTarget = { targetModel, targetIds };
			const expectedParams = [[expectedTarget], userId, pagination];
			expect(findAllUnpublishedByTargetSpy).toHaveBeenCalledWith(...expectedParams);
		});
	});
	describe('create', () => {
		it('should assign all properties to news object', async () => {
			const params = {
				title: 'title',
				content: 'content',
				displayAt: new Date(),
				target: { targetModel: NewsTargetModel.School, targetId: schoolId },
			} as CreateNews;
			const createdNews = await service.create(userId, schoolId, params);
			expect(createdNews.school).toEqual(schoolId);
			expect(createdNews.creator).toEqual(userId);
			expect(createdNews.targetModel === NewsTargetModel.Course);
			expect(createdNews.target.id === schoolId);
		});

		it('should save the news', async () => {
			const createSpy = jest.spyOn(repo, 'save');
			const params = {
				title: 'title',
				content: 'content',
				displayAt: new Date(),
				target: { targetModel: NewsTargetModel.School, targetId: schoolId },
			} as CreateNews;
			await service.create(userId, schoolId, params);
			expect(createSpy).toHaveBeenCalled();
		});

		// TODO test authorization
	});

	describe('findOneByIdForUser', () => {
		it('should find news by id for user', async () => {
			const foundNews = await service.findOneByIdForUser(newsId, userId);
			const expected = {
				...exampleCourseNews,
				permissions: NEWS_PERMISSIONS,
			};
			expect(foundNews).toStrictEqual(expected);
		});

		it('should throw not found exception if news was not found', async () => {
			const anotherNewsId = new ObjectId().toHexString();
			await expect(service.findOneByIdForUser(anotherNewsId, userId)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('should update news', async () => {
			const params = {
				title: 'new title',
				content: 'new content',
			};
			const updatedNews = await service.update(newsId, userId, params);
			expect(updatedNews.title).toBe(params.title);
			expect(updatedNews.content).toBe(params.content);
			expect(updatedNews.updater).toBe(userId);
		});

		it('should throw Unauthorized exception if user has no NEWS_EDIT permissions', async () => {
			const anotherUserId = new ObjectId().toHexString();
			const params = {};
			await expect(service.update(newsId, anotherUserId, params)).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('delete', () => {
		it('should successfully delete news', async () => {
			const result = await service.delete(newsId, userId);
			expect(result).toBe(newsId);
		});

		it('should throw Unauthorized exception if user doesnt have permission NEWS_EDIT', async () => {
			const anotherUser = new ObjectId().toHexString();
			await expect(service.delete(newsId, anotherUser)).rejects.toThrow(UnauthorizedException);
		});
	});
});
