import { ObjectId } from 'bson';
import { UserSearchQuery } from '../..';
import { createMultiDocumentAggregation } from './aggregation-helper';

describe('Aggregation helper', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('when searching by users ids', () => {
		const setup = () => {
			const exampleId = '5fa31aacb229544f2c697b48';

			const query: UserSearchQuery = {
				skip: 0,
				limit: 5,
				sort: { firstName: 1 },
				_id: [exampleId],
				schoolId: new ObjectId(exampleId),
				schoolYearId: new ObjectId(exampleId),
				roles: new ObjectId(exampleId),
				select: [
					'consentStatus',
					'consent',
					'classes',
					'firstName',
					'lastName',
					'email',
					'createdAt',
					'importHash',
					'birthday',
					'preferences.registrationMailSend',
					'lastLoginSystemChange',
					'outdatedSince',
				],
			};

			const matchStage = {
				$match: {
					_id: { $in: [new ObjectId(exampleId)] },
					roles: new ObjectId(exampleId),
					schoolId: new ObjectId(exampleId),
				},
			};

			return {
				query,
				matchStage,
			};
		};

		it('should provide match for ids', () => {
			const { query, matchStage } = setup();

			const aggregation = createMultiDocumentAggregation(query);

			expect(aggregation).toEqual(expect.arrayContaining([expect.objectContaining(matchStage)]));
		});
	});

	describe('when searching by searchQuery', () => {
		const setup = () => {
			const exampleId = '5fa31aacb229544f2c697b48';

			const query: UserSearchQuery = {
				skip: 0,
				limit: 5,
				sort: { firstName: 1, sortBySearchQueryResult: 1 },
				searchQuery: 'test',
				searchFilterGate: 9,
				schoolId: new ObjectId(exampleId),
				schoolYearId: new ObjectId(exampleId),
				roles: new ObjectId(exampleId),
				select: [
					'consentStatus',
					'consent',
					'classes',
					'firstName',
					'lastName',
					'email',
					'createdAt',
					'importHash',
					'birthday',
					'preferences.registrationMailSend',
					'lastLoginSystemChange',
					'outdatedSince',
				],
			};

			return {
				query,
				exampleId,
			};
		};

		it('should provide match for score text search in aggregation', () => {
			const { query } = setup();

			const aggregation = createMultiDocumentAggregation(query);

			expect(aggregation).toEqual(
				expect.arrayContaining([expect.objectContaining({ $match: { score: { $gte: 9 } } })])
			);
		});
	});

	describe('when searching by classes', () => {
		const setup = () => {
			const exampleId = '5fa31aacb229544f2c697b48';

			const query: UserSearchQuery = {
				skip: 0,
				limit: 5,
				sort: { firstName: 1 },
				classes: ['test'],
				schoolId: new ObjectId(exampleId),
				schoolYearId: new ObjectId(exampleId),
				roles: new ObjectId(exampleId),
				select: [
					'consentStatus',
					'consent',
					'classes',
					'firstName',
					'lastName',
					'email',
					'createdAt',
					'importHash',
					'birthday',
					'preferences.registrationMailSend',
					'lastLoginSystemChange',
					'outdatedSince',
				],
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
				query,
				classesLookupStage,
			};
		};

		it('should provide lookup stage in aggregation', () => {
			const { query, classesLookupStage } = setup();

			const aggregation = createMultiDocumentAggregation(query);

			expect(aggregation).toEqual(expect.arrayContaining([expect.objectContaining(classesLookupStage)]));
		});
	});
});
