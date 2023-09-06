import { Injectable } from '@nestjs/common';
import { FederalStateService } from '../service/federal-state.service';

@Injectable()
export class FederalStateUC {
	constructor(
		private readonly federalStateService: FederalStateService // 	private readonly authorizationService: AuthorizationService, // 	private readonly lessonService: LessonService
	) {}

	createFederalState() {
		return 'hi from the uc';
	}

	findAll() {
		const federalStates = this.federalStateService.findAll();
		return federalStates;
	}

	async findFederalStateByName(name: string) {
		const federalState = await this.federalStateService.findFederalStateByName(name);
		return federalState;
	}
	// async delete(userId: EntityId, lessonId: EntityId) {
	// 	const [user, lesson] = await Promise.all([
	// 		this.authorizationService.getUserWithPermissions(userId),
	// 		this.lessonService.findById(lessonId),
	// 	]);
	// 	// Check by Permission.TOPIC_VIEW because the student doesn't have Permission.TOPIC_EDIT
	// 	// is required for CourseGroup lessons
	// 	this.authorizationService.checkPermission(user, lesson, AuthorizationContextBuilder.write([Permission.TOPIC_VIEW]));
	// 	await this.lessonService.deleteLesson(lesson);
	// 	return true;
	// }
}
