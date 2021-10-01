import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { courseFactory } from '../factory/course.factory';
import { CourseGroup } from './coursegroup.entity';

describe('CourseEntity', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseGroup();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const course = courseFactory.build();
			course._id = new ObjectId();
			const courseGroup = new CourseGroup({ course });
			expect(courseGroup instanceof CourseGroup).toEqual(true);
		});
	});

	// TODO check if and how we need this
	describe('getParent', () => {
		it('should return the right id.', () => {
			const course = courseFactory.build();
			course._id = new ObjectId();
			const courseGroup = new CourseGroup({ course });

			const result = courseGroup.getParentId();
			expect(result).toEqual(course._id);
		});
	});
});
