import { Injectable } from '@nestjs/common';
import { Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
	private numberOfUsersOnServerCounter: Gauge<string>;

	private numberOfBoardroomsOnServerCounter: Gauge<string>;

	constructor() {
		this.numberOfUsersOnServerCounter = new Gauge({
			name: 'sc_boards_users',
			help: 'Number of active users per pod',
		});

		this.numberOfBoardroomsOnServerCounter = new Gauge({
			name: 'sc_boards_rooms',
			help: 'Number of active boards per pod',
		});

		register.registerMetric(this.numberOfUsersOnServerCounter);
		register.registerMetric(this.numberOfBoardroomsOnServerCounter);
	}

	public incrementNumberOfUsersOnServerCounter(): void {
		this.numberOfUsersOnServerCounter.inc();
	}

	public decrementNumberOfUsersOnServerCounter(): void {
		this.numberOfUsersOnServerCounter.dec();
	}

	public setNumberOfBoardRooms(value: number): void {
		this.numberOfBoardroomsOnServerCounter.set(value);
	}
}
