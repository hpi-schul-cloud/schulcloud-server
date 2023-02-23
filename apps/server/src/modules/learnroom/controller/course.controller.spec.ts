import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { CourseExportUc } from '@src/modules/learnroom/uc/course-export.uc';
import { CourseController } from './course.controller';
import { CourseUc } from '../uc/course.uc';

describe('CourseController', () => {
	let controller: CourseController;
	let courseUcMock: DeepMocked<CourseUc>;
	let courseExportUcMock: DeepMocked<CourseExportUc>;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				CourseController,
				{
					provide: CourseUc,
					useValue: createMock<CourseUc>(),
				},
				{
					provide: CourseExportUc,
					useValue: createMock<CourseExportUc>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		courseUcMock = module.get(CourseUc);
		courseExportUcMock = module.get(CourseExportUc);
		configServiceMock = module.get(ConfigService);
		controller = module.get(CourseController);
	});

	beforeEach(() => {
		courseUcMock.findAllByUser.mockClear();
	});

	describe('findForUser', () => {
		it('should call uc', async () => {
			courseUcMock.findAllByUser.mockResolvedValueOnce([[], 0]);

			const currentUser = { userId: 'userId' } as ICurrentUser;
			await controller.findForUser(currentUser, { skip: 0, limit: 50 });

			expect(courseUcMock.findAllByUser).toHaveBeenCalledWith('userId', { skip: 0, limit: 50 });
		});

		it('should map result to response', async () => {
			const courseMock = {
				getMetadata: () => {
					return {
						id: 'courseId',
						title: 'courseName',
						shortTitle: 'co',
						displayColor: '#ACACAC',
					};
				},
			} as Course;
			courseUcMock.findAllByUser.mockResolvedValueOnce([[courseMock], 1]);

			const currentUser = { userId: 'userId' } as ICurrentUser;
			const result = await controller.findForUser(currentUser, { skip: 0, limit: 100 });

			expect(result.total).toEqual(1);
			expect(result.data[0].title).toEqual('courseName');
		});
	});

	describe('exportCourse', () => {
		it('should return an imscc file', async () => {
			courseExportUcMock.exportCourse.mockResolvedValueOnce({} as Buffer);

			configServiceMock.get.mockReturnValue(true);

			await expect(
				controller.exportCourse({ userId: 'userId' } as ICurrentUser, '', { set: () => {} } as unknown as Response)
			).resolves.toBeDefined();
		});
		it('should return not found if feature is disabled', async () => {
			configServiceMock.get.mockReturnValue(false);
			await expect(
				controller.exportCourse({ userId: 'userId' } as ICurrentUser, '', { set: () => {} } as unknown as Response)
			).rejects.toThrow(NotFoundException);
		});
	});
});
