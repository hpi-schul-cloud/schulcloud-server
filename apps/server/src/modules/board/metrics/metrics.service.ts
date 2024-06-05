import { Injectable } from '@nestjs/common';
import { Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
	private numberOfUsersOnServerCounter: Gauge<string>;

	private numberOfBoardroomsOnServerCounter: Gauge<string>;

	private numberOfEditorsOnServerCounter: Gauge<string>;

	private numberOfViewersOnServerCounter: Gauge<string>;

	constructor() {
		this.numberOfUsersOnServerCounter = new Gauge({
			name: 'sc_boards_users',
			help: 'Number of active users per pod',
		});

		this.numberOfBoardroomsOnServerCounter = new Gauge({
			name: 'sc_boards_rooms',
			help: 'Number of active boards per pod',
		});

		this.numberOfEditorsOnServerCounter = new Gauge({
			name: 'sc_boards_editors',
			help: 'Number of active editors per pod',
		});

		this.numberOfViewersOnServerCounter = new Gauge({
			name: 'sc_boards_viewers',
			help: 'Number of active viewers per pod',
		});

		register.registerMetric(this.numberOfUsersOnServerCounter);
		register.registerMetric(this.numberOfBoardroomsOnServerCounter);
	}

	public setNumberOfUsers(value: number): void {
		this.numberOfUsersOnServerCounter.set(value);
	}

	public setNumberOfBoardRooms(value: number): void {
		this.numberOfBoardroomsOnServerCounter.set(value);
	}

	public incrementNumberOfEditors(): void {
		this.numberOfEditorsOnServerCounter.inc();
	}

	public decrementNumberOfEditors(): void {
		this.numberOfEditorsOnServerCounter.dec();
	}

	public incrementNumberOfViewers(): void {
		this.numberOfViewersOnServerCounter.inc();
	}

	public decrementNumberOfViewers(): void {
		this.numberOfViewersOnServerCounter.dec();
	}
}
