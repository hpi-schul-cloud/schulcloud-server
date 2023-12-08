export abstract class AbstractEvent<T> {
	abstract getEventName(): string;

	abstract payload: T;
}
