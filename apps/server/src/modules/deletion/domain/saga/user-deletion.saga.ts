import { Injectable } from '@nestjs/common';
import { Saga, ofType, ICommand } from '@nestjs/cqrs';
import { map, Observable } from 'rxjs';
import { DataDeletedEvent } from '../event';
import { UserDeletedCommand } from '../command';

@Injectable()
export class UserDeletionSaga {
	@Saga()
	userDeletion = (events$: Observable<any>): Observable<ICommand> =>
		events$.pipe(
			ofType(DataDeletedEvent),
			map((event) => new UserDeletedCommand(event.deletionRequestId, event.domainDeletionReport))
		);
}
