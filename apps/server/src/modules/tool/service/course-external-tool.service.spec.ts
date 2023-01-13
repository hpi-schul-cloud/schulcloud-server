import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseExternalToolRepo } from '@shared/repo/courseexternaltool/course-external-tool.repo';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { CourseExternalToolDO } from '@shared/domain/domainobject/external-tool/course-external-tool.do';
import { courseExternalToolDOFactory } from '@shared/testing/factory/domainobject/course-external-tool.factory';
import { CourseExternalToolService } from './course-external-tool.service';

describe('CourseExternalToolService', () => {
	let module: TestingModule;
	let service: CourseExternalToolService;

	let courseExternalToolRepo: DeepMocked<CourseExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseExternalToolService,
				{
					provide: CourseExternalToolRepo,
					useValue: createMock<CourseExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(CourseExternalToolService);
		courseExternalToolRepo = module.get(CourseExternalToolRepo);
	});

	const setup = () => {
		const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.build();
		const courseExternalTool1: CourseExternalToolDO = courseExternalToolDOFactory.build();
		const courseExternalTool2: CourseExternalToolDO = courseExternalToolDOFactory.build();
		return {
			schoolExternalTool,
			schoolExternalToolId: schoolExternalTool.id as string,
			courseExternalTool1,
			courseExternalTool2,
		};
	};

	describe('deleteBySchoolExternalToolId is called', () => {
		describe('when schoolExternalToolId is given', () => {
			it('should call courseExternalToolRepo.find()', async () => {
				const { schoolExternalToolId } = setup();

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

				expect(courseExternalToolRepo.find).toHaveBeenCalledWith({ schoolToolId: schoolExternalToolId });
			});

			it('should call courseExternalToolRepo.deleteBySchoolExternalToolIds()', async () => {
				const { schoolExternalToolId, courseExternalTool1, courseExternalTool2 } = setup();
				courseExternalToolRepo.find.mockResolvedValue([courseExternalTool1, courseExternalTool2]);

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

				expect(courseExternalToolRepo.delete).toHaveBeenCalledWith([courseExternalTool1.id, courseExternalTool2.id]);
			});
		});
	});
});
