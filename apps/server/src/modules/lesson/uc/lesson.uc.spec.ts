import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, PermissionContextBuilder } from '@shared/domain';
import { lessonFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService, LessonUC } from '@src/modules';
import { LessonService } from '../service';

describe('LessonUC', () => {
	let lessonUC: LessonUC;
	let module: TestingModule;

	let lessonService: DeepMocked<LessonService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LessonUC,
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();
		lessonUC = module.get(LessonUC);

		lessonService = module.get(LessonService);
		authorizationService = module.get(AuthorizationService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(lessonUC).toBeDefined();
	});

	it('delete', async () => {
		const user = userFactory.buildWithId();
		const lesson = lessonFactory.buildWithId();

		authorizationService.getUserWithPermissions.mockResolvedValue(user);
		lessonService.findById.mockResolvedValue(lesson);

		const result = await lessonUC.delete(user.id, lesson.id);

		expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
		expect(lessonService.findById).toHaveBeenCalledWith(lesson.id);

		expect(authorizationService.checkPermission).toHaveBeenCalledWith(
			expect.objectContaining({ ...user }),
			expect.objectContaining({ ...lesson }),
			PermissionContextBuilder.write([Permission.TOPIC_VIEW])
		);
		expect(lessonService.deleteLesson).toHaveBeenCalledWith(expect.objectContaining({ ...lesson }));

		expect(result).toBe(true);
	});
});
