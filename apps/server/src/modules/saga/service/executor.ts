import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SagaInjectionService } from './injection';
import { UserDeletionSaga } from '../sagas/user-deletion';
import { Saga } from '../interface/saga';

@Injectable()
export class SagaExecutorService {
	private readonly sagas: Map<string, Saga> = new Map();

	constructor(private readonly sagaInjectionService: SagaInjectionService) {
		this.sagas.set('user-deletion', new UserDeletionSaga(this.sagaInjectionService));
		// add other sagas here
	}

	public async executeSaga<T = any>(sagaName: string, data?: T): Promise<void> {
		const saga = this.sagas.get(sagaName);
		if (!saga) {
			throw new Error(`Saga ${sagaName} not found`);
		}
		try {
			const finalMessage = await saga.invoke(data);
			console.log(finalMessage); // replace with logger
		} catch (error) {
			// should never happen
			throw new InternalServerErrorException(`Unexpected error during saga execution of ${sagaName}`);
		}
	}
}
