import { News } from '@shared/domain';
import { NewsTargetModel } from '@shared/domain/types/news.types';
import { ObjectId } from '@mikro-orm/mongodb';
import { NewsScope } from '@src/modules/news/repo/news-scope';
import { NewsTargetFilter } from '@src/modules/news/repo/news-target-filter';
import { FilterQuery } from '@mikro-orm/core';
import { EmptyResultQuery } from '@shared/repo';

describe('News Scope', () => {
	describe('build scope query', () => {
		it('should create valid query returning no results for empty scope', () => {
			const scope = new NewsScope();
			const result = scope.query;
			expect(result).toBe(EmptyResultQuery);
		});
		it('should create valid query returning no results for empty targets', () => {
			const scope = new NewsScope();
			scope.byTargets([]);
			const result = scope.query;
			expect(result).toBe(EmptyResultQuery);
		});
		it('should create scope query for one target', () => {
			const courseTargetId = new ObjectId().toHexString();
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [courseTargetId],
			} as NewsTargetFilter;
			const scope = new NewsScope();
			scope.byTargets([target]);
			const result = scope.query;
			const expected = {
				$and: [
					{
						targetModel: NewsTargetModel.Course,
					},
					{
						'target:in': [courseTargetId],
					},
				],
			} as FilterQuery<News>;
			expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
		});
		it('should create scope query for multiple targets', () => {
			const courseTargetId = new ObjectId().toHexString();
			const teamTargetId = new ObjectId().toHexString();
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [courseTargetId],
			} as NewsTargetFilter;

			const target2 = {
				targetModel: NewsTargetModel.Team,
				targetIds: [teamTargetId],
			} as NewsTargetFilter;
			const scope = new NewsScope();
			scope.byTargets([target, target2]);
			const result = scope.query;
			const expected = {
				$or: [
					{
						$and: [
							{
								targetModel: NewsTargetModel.Course,
							},
							{
								'target:in': [courseTargetId],
							},
						],
					},
					{
						$and: [
							{
								targetModel: NewsTargetModel.Team,
							},
							{
								'target:in': [teamTargetId],
							},
						],
					},
				],
			} as FilterQuery<News>;
			expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
		});
		it('should create correct query for unpublished', () => {
			const scope = new NewsScope();
			scope.byUnpublished(true);
			const result = scope.query;
			expect(result).toHaveProperty('displayAt');
		});
	});
});
