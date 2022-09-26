import { Controller, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import { LessonUrlParams } from './dto';
import { LessonUC } from '../uc';

@ApiTags('Lesson')
@Authenticate('jwt')
@Controller('lessons')
export class LessonController {
	constructor(private readonly lessonUC: LessonUC) {}

	@Delete(':lessonId')
	async delete(
		@Param() urlParams: LessonUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@JWT() jwt: string
	): Promise<boolean> {
		const result = await this.lessonUC.delete(currentUser.userId, urlParams.lessonId, jwt);

		return result;
	}
}
