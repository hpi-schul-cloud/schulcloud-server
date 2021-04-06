import { EventEmitter } from 'events';

declare module '@feathersjs/feathers' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export interface Application<ServiceTypes> extends EventEmitter {
		registerFacade<T>(route: string, t: T): void;
		facade<T>(path: string): T;
	}
}
