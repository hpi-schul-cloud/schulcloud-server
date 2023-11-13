import { Authenticate, CurrentUser, CurrentUserInterface } from '@modules/authentication';
import { Controller, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LessonUC } from '../uc';
import { LessonUrlParams } from './dto';

@ApiTags('Lesson')
@Authenticate('jwt')
@Controller('lessons')
export class LessonController {
	constructor(private readonly lessonUC: LessonUC) {}

	@Delete(':lessonId')
	async delete(
		@Param() urlParams: LessonUrlParams,
		@CurrentUser() currentUser: CurrentUserInterface
	): Promise<boolean> {
		const result = await this.lessonUC.delete(currentUser.userId, urlParams.lessonId);

		return result;
	}
}
