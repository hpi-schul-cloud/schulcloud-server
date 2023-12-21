import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CourseDeletedEvent } from '@modules/learnroom';
import { VideoConferenceService } from '../service';

@EventsHandler(CourseDeletedEvent)
export class CourseDeletedHandler implements IEventHandler<CourseDeletedEvent> {
	constructor(private readonly videoConferenceService: VideoConferenceService) {}

	async handle(event: CourseDeletedEvent) {
		console.log('handle course deleted:', event);
		await this.videoConferenceService.deleteByCourse(event.courseId);
	}
}
