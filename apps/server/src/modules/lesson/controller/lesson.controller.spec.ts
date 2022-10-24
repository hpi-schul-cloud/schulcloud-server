import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { LessonUC } from '../uc';
import { LessonController } from './lesson.controller';

describe('lesson controller', () => {
	let lessonController: LessonController;
	let lessonUc: DeepMocked<LessonUC>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
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
