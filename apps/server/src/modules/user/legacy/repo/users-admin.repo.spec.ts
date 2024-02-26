import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { User } from '@shared/domain/entity';
import { EntityManager } from '@mikro-orm/mongodb';
import { ObjectId } from 'bson';
import { UsersSearchQueryParams } from '../controller/dto';
import { UsersAdminRepo } from './users-admin.repo';

describe('users admin repo', () => {
	let module: TestingModule;
	let repo: UsersAdminRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UsersAdminRepo],
		}).compile();
		repo = module.get(UsersAdminRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getUserByIdWithNestedData).toEqual('function');
		expect(typeof repo.getUsersWithNestedData).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(User);
	});

	describe('when searching by users ids', () => {
		const setup = () => {
			const aggregationSpy = jest.spyOn(em, 'aggregate').mockResolvedValueOnce([]);

			const exampleId = '5fa31aacb229544f2c697b48';

			const queryParams: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
				users: [exampleId],
			};

			const matchStage = {
				$match: {
					_id: { $in: [new ObjectId(exampleId)] },
					roles: new ObjectId(exampleId),
					schoolId: new ObjectId(exampleId),
				},
			};

			return {
				queryParams,
				aggregationSpy,
				exampleId,
				matchStage,
			};
		};

		it('should provide match for ids', async () => {
			const { queryParams, aggregationSpy, exampleId, matchStage } = setup();

			await repo.getUsersWithNestedData(exampleId, exampleId, exampleId, queryParams);

			expect(aggregationSpy).toHaveBeenCalledWith(
				User,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				expect.arrayContaining([expect.objectContaining(matchStage)])
			);
		});
	});

	describe('when searching by searchQuery', () => {
		const setup = () => {
			const aggregationSpy = jest.spyOn(em, 'aggregate').mockResolvedValueOnce([]);

			const exampleId = '5fa31aacb229544f2c697b48';

			const queryParams: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
				searchQuery: 'test',
			};

			return {
				queryParams,
				aggregationSpy,
				exampleId,
			};
		};

		it('should provide match for score text search in aggregation', async () => {
			const { queryParams, aggregationSpy, exampleId } = setup();

			await repo.getUsersWithNestedData(exampleId, exampleId, exampleId, queryParams);

			expect(aggregationSpy).toHaveBeenCalledWith(
				User,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				expect.arrayContaining([expect.objectContaining({ $match: { score: { $gte: 9 } } })])
			);
		});
	});

	describe('when searching by classes', () => {
		const setup = () => {
			const aggregationSpy = jest.spyOn(em, 'aggregate').mockResolvedValueOnce([]);

			const exampleId = '5fa31aacb229544f2c697b48';

			const queryParams: UsersSearchQueryParams = {
				$skip: 0,
				$limit: 5,
				$sort: { firstName: 1 },
				classes: ['test'],
			};

			const classesLookupStage = {
				$lookup: {
					as: 'classes',
					from: 'classes',
					let: { id: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $eq: ['$schoolId', new ObjectId(exampleId)] },
										{
											$and: [
												{
													$or: [{ $eq: ['$year', new ObjectId(exampleId)] }, { $eq: [{ $type: '$year' }, 'missing'] }],
												},
												{
													$or: [{ $max: '$gradeLevel' }, { $eq: [{ $type: '$gradeLevel' }, 'missing'] }],
												},
											],
										},
										{
											$or: [{ $in: ['$$id', '$userIds'] }, { $in: ['$$id', '$teacherIds'] }],
										},
									],
								},
							},
						},
						{
							$sort: {
								year: -1,
								gradeLevel: -1,
								name: 1,
							},
						},
						{
							$project: {
								gradeLevel: {
									$convert: {
										input: '$gradeLevel',
										to: 'string',
										onNull: '',
									},
								},
								name: {
									$convert: {
										input: '$name',
										to: 'string',
										onNull: '',
									},
								},
							},
						},
					],
				},
			};

			return {
				queryParams,
				aggregationSpy,
				exampleId,
				classesLookupStage,
			};
		};

		it('should provide lookup stage in aggregation', async () => {
			const { queryParams, aggregationSpy, exampleId, classesLookupStage } = setup();

			await repo.getUsersWithNestedData(exampleId, exampleId, exampleId, queryParams);

			expect(aggregationSpy).toHaveBeenCalledWith(
				User,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				expect.arrayContaining([expect.objectContaining(classesLookupStage)])
			);
		});
	});
});
