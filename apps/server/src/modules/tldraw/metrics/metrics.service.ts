import { Injectable } from '@nestjs/common';
import { Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
	private numberOfUsersOnServerCounter: Gauge<string>;

	private numberOfBoardsOnServerCounter: Gauge<string>;

	constructor() {
		this.numberOfUsersOnServerCounter = new Gauge({
			name: 'sc_tldraw_users',
			help: 'Number of active users per pod',
		});

		this.numberOfBoardsOnServerCounter = new Gauge({
			name: 'sc_tldraw_boards',
			help: 'Number of active boards per pod',
		});

		register.registerMetric(this.numberOfUsersOnServerCounter);
		register.registerMetric(this.numberOfBoardsOnServerCounter);
	}

	public incrementNumberOfUsersOnServerCounter(): void {
		this.numberOfUsersOnServerCounter.inc();
	}

	public decrementNumberOfUsersOnServerCounter(): void {
		this.numberOfUsersOnServerCounter.dec();
	}

	public incrementNumberOfBoardsOnServerCounter(): void {
		this.numberOfBoardsOnServerCounter.inc();
	}

	public decrementNumberOfBoardsOnServerCounter(): void {
		this.numberOfBoardsOnServerCounter.dec();
	}
}
