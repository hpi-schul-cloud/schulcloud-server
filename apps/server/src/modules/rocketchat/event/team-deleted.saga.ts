import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { TeamDeletedEvent } from '@modules/teams';
import { delay, map } from 'rxjs/operators';
import { DeleteRocketChatChannelCommand } from '@modules/rocketchat';

@Injectable()
export class TeamDeletedSaga {
	@Saga()
	dragonKilled = (events$: Observable<any>): Observable<ICommand> =>
		events$.pipe(
			ofType(TeamDeletedEvent),
			delay(1000),
			map((event) => {
				console.log('Inside [TeamDeletedSaga] Saga', event.teamId);

				return new DeleteRocketChatChannelCommand(event.teamId);
			})
		);
}
