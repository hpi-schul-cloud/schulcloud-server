import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { INewsScope } from './news.interface';

import { AuthorizationService } from '../../authorization/authorization.service';
import { LoggerModule } from '../../../core/logger/logger.module';
import { NewsRepo } from '../repo/news.repo';
import { NewsUc } from './news.uc';
import { NewsTargetModel } from '../entity';

describe('NewsUc', () => {
	let service: NewsUc;
	let repo: NewsRepo;
	const userId = new ObjectId().toString();
	const schoolId = new ObjectId().toString();
	const pagination = {};
	const courseTargetId = 'course1';
	const teamTargetId = 'team1';
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
						findAll() {
							return [];
						},
						findAllBySchool() {
							return [];
						},
						findAllByTarget() {
							return [];
						},
					},
				},
				{
					provide: AuthorizationService,
					useValue: {
						checkUserSchoolPermissions() {},
						checkUserTargetPermissions() {},
						// eslint-disable-next-line @typescript-eslint/no-shadow
						getPermittedTargets(userId, targetModel, permissions) {
							return targets
								.filter((target) => target.targetModel === targetModel)
								.flatMap((target) => target.targetIds);
						},
						getUserTargetPermissions() {},
						getUserSchoolPermissions() {},
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

	describe('findAllByUserAndSchool', () => {
		it('should search for news with by schoolId and empty scope ', async () => {
			const scope = {};
			const findAllSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUserAndSchool(userId, schoolId, scope, pagination);
			const expectedParams = [schoolId, targets, false, pagination];
			expect(findAllSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for news by school id', async () => {
			const scope: INewsScope = {
				target: {
					targetModel: 'school',
				},
			};
			const findAllBySchoolSpy = jest.spyOn(repo, 'findAllBySchool');
			await service.findAllForUserAndSchool(userId, schoolId, scope, pagination);
			const expectedParams = [schoolId, false, pagination];
			expect(findAllBySchoolSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for course news with given courseId', async () => {
			const scope = {
				target: {
					targetModel: NewsTargetModel.Course,
					targetId: courseTargetId,
				},
			};
			const findAllByTargetSpy = jest.spyOn(repo, 'findAllByTarget');
			await service.findAllForUserAndSchool(userId, schoolId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [schoolId, expectedTarget, false, pagination];
			expect(findAllByTargetSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for all course news if course id is not given', async () => {
			const targetModel = NewsTargetModel.Course;
			const scope = { target: { targetModel } };
			const findAllByTargetSpy = jest.spyOn(repo, 'findAllByTarget');
			await service.findAllForUserAndSchool(userId, schoolId, scope, pagination);
			const targetIds = targets
				.filter((target) => target.targetModel === targetModel)
				.flatMap((target) => target.targetIds);
			const expectedTarget = { targetModel, targetIds };
			const expectedParams = [schoolId, expectedTarget, false, pagination];
			expect(findAllByTargetSpy).toHaveBeenCalledWith(...expectedParams);
		});
	});
});
