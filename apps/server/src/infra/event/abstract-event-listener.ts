import { Injectable } from '@nestjs/common';
import { AbstractEvent } from './abstract-event';

@Injectable()
export abstract class AbstractEventListener<T extends AbstractEvent<unknown>> {
	abstract handleEvent(event: T): Promise<void>;
}
