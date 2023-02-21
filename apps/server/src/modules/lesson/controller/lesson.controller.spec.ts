import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';;
import { LessonUC } from '../uc';
import { LessonController } from './lesson.controller';

describe('lesson controller', () => {
	let module: TestingModule;
	let lessonController: LessonController;
	let lessonUc: DeepMocked<LessonUC>;

	afterAll(async () => {
		await module.close();
	});
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				LessonController,
				{
					provide: LessonUC,
					useValue: createMock<LessonUC>(),
				},
			],
		}).compile();
		lessonController = module.get(LessonController);
		lessonUc = module.get(LessonUC);
	});

	describe('delete lesson', () => {
		it('should call uc', async () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const lessonParams = { lessonId: 'lessonId' };

			await lessonController.delete(lessonParams, currentUser);

			expect(lessonUc.delete).toHaveBeenCalledWith(currentUser.userId, lessonParams.lessonId);
		});
	});
});
