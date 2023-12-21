import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TeamEventDeletedEvent } from '@modules/teams';
import { VideoConferenceService } from '../service';

@EventsHandler(TeamEventDeletedEvent)
export class TeamEventDeletedHandler implements IEventHandler<TeamEventDeletedEvent> {
	constructor(private readonly videoConferenceService: VideoConferenceService) {}

	async handle(event: TeamEventDeletedEvent) {
		console.log('handle teamEvent deleted:', event);
		await this.videoConferenceService.deleteByTeamEvent(event.eventId);
	}
}
