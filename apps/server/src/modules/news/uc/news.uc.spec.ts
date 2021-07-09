import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { LoggerModule } from '@src/core/logger/logger.module';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { UnauthorizedException } from '@nestjs/common';
import { NewsTargetModel, ICreateNews } from '../entity/news.types';

import { AuthorizationService } from '../../authorization/authorization.service';
import { NewsRepo } from '../repo/news.repo';
import { NewsUc } from './news.uc';

describe('NewsUc', () => {
	let service: NewsUc;
	let repo: NewsRepo;
	const courseTargetId = 'course1';
	const teamTargetId = 'team1';
	const NEWS_PERMISSIONS = ['NEWS_VIEW', 'NEWS_EDIT'];

	const userId = new ObjectId().toString();
	const schoolId = new ObjectId().toString();
	const newsId = new ObjectId().toString();
	const displayAt = new Date();
	const exampleCourseNews = {
		_id: newsId,
		displayAt,
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

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule],
			providers: [
				NewsUc,
				{
					provide: NewsRepo,
					useValue: {
						persistAndFlush() {
							return {};
						},
						findAll() {
							return [[exampleCourseNews], 1];
						},
						findOneById(id) {
							if (id === newsId) {
								return exampleCourseNews;
							}
							throw new NotFoundException();
						},
						removeAndFlush() {},
					},
				},
				{
					provide: AuthorizationService,
					useValue: {
						checkEntityPermissions(user) {
							if (userId !== user) {
								throw new UnauthorizedException();
							}
						},
						// eslint-disable-next-line @typescript-eslint/no-shadow
						getPermittedEntities(userId, targetModel, permissions) {
							return targets
								.filter((target) => target.targetModel === targetModel)
								.flatMap((target) => target.targetIds);
						},
						getEntityPermissions() {
							return NEWS_PERMISSIONS;
						},
					},
				},
			],
		}).compile();

		service = module.get<NewsUc>(NewsUc);
		repo = module.get<NewsRepo>(NewsRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllByUser', () => {
		it('should search for news by empty scope ', async () => {
			const scope = {};
			const findAllSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const expectedParams = [targets, false, pagination];
			expect(findAllSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for school news with given school id', async () => {
			const scope = {
				target: {
					targetModel: NewsTargetModel.School,
					targetId: schoolId,
				},
			};
			const findAllBySchoolSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], false, pagination];
			expect(findAllBySchoolSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for course news with given courseId', async () => {
			const scope = {
				target: {
					targetModel: NewsTargetModel.Course,
					targetId: courseTargetId,
				},
			};
			const findAllByCourseSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], false, pagination];
			expect(findAllByCourseSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for all course news if course id is not given', async () => {
			const targetModel = NewsTargetModel.Course;
			const scope = { target: { targetModel } };
			const findAllByTargetSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const targetIds = targets
				.filter((target) => target.targetModel === targetModel)
				.flatMap((target) => target.targetIds);
			const expectedTarget = { targetModel, targetIds };
			const expectedParams = [[expectedTarget], false, pagination];
			expect(findAllByTargetSpy).toHaveBeenCalledWith(...expectedParams);
		});
	});
	describe('create', () => {
		it('should assign all required properties to news object', async () => {
			const createSpy = jest.spyOn(repo, 'persistAndFlush');
			const params = {
				title: 'title',
				content: 'content',
				displayAt: new Date(),
				target: { targetModel: NewsTargetModel.School, targetId: schoolId },
			} as ICreateNews;
			await service.create(userId, schoolId, params);
			expect(createSpy).toHaveBeenCalled();
			const newsProps = createSpy.mock.calls[0][0];
			expect(newsProps.school.id === schoolId);
			expect(newsProps.creator.id === userId);
		});

		it('should assign target to news object', async () => {
			const courseId = new ObjectId().toString();
			const createSpy = jest.spyOn(repo, 'persistAndFlush');
			const params = {
				title: 'title',
				content: 'content',
				displayAt: new Date(),
				target: { targetModel: 'courses', targetId: courseId },
			} as ICreateNews;
			await service.create(userId, schoolId, params);
			expect(createSpy).toHaveBeenCalled();
			const newsProps = createSpy.mock.calls[0][0];
			expect(newsProps.school.id === schoolId);
			expect(newsProps.creator.id === userId);
			expect(newsProps.targetModel === 'courses');
			expect(newsProps.target.id === courseId);
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
