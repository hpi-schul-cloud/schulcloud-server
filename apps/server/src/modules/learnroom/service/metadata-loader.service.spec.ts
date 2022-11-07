import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LearnroomTypes } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { courseFactory, setupEntities } from '@shared/testing';
import { MetadataLoader } from './metadata-loader.service';

describe('metadata loader service', () => {
	let module: TestingModule;
	let service: MetadataLoader;
	let courseRepo: DeepMocked<CourseRepo>;
	let orm: MikroORM;

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				MetadataLoader,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(MetadataLoader);
		courseRepo = module.get(CourseRepo);
	});

	it('should load course from course repo', async () => {
		const course = courseFactory.buildWithId();
		await service.loadMetadata({ type: LearnroomTypes.Course, id: course.id });
		expect(courseRepo.findById).toHaveBeenCalledWith(course.id);
	});

	it('should get metadata from course', async () => {
		const course = courseFactory.buildWithId();
		course.getMetadata = jest.fn();
		courseRepo.findById.mockResolvedValue(course);
		await service.loadMetadata({ type: LearnroomTypes.Course, id: course.id });
		expect(course.getMetadata).toHaveBeenCalled();
	});

	it('should return course metadata', async () => {
		const course = courseFactory.buildWithId();
		courseRepo.findById.mockResolvedValue(course);
		const result = await service.loadMetadata({ type: LearnroomTypes.Course, id: course.id });
		expect(result).toEqual(course.getMetadata());
	});

	it('should throw on unsupported type', async () => {
		const course = courseFactory.buildWithId();
		await expect(
			// @ts-expect-error should throw
			service.loadMetadata({ type: 'unsupported', id: course.id })
		).rejects.toThrow(NotImplementedException);
	});
});
