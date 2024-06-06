import { Injectable } from '@nestjs/common';
import { Gauge, register } from 'prom-client';

type ClientId = string;
type Role = 'owner' | 'editor' | 'viewer';

@Injectable()
export class MetricsService {
	private knownClientRoles: Map<ClientId, Role> = new Map();

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

	public isClientRoleKnown(clientId: ClientId): boolean {
		return this.knownClientRoles.has(clientId);
	}

	public trackClientRole(clientId: ClientId, role: Role): void {
		this.knownClientRoles.set(clientId, role);
		this.updateRoleCounts();
	}

	public untrackClient(clientId: ClientId): void {
		this.knownClientRoles.delete(clientId);
		this.updateRoleCounts();
	}

	private updateRoleCounts(): void {
		this.numberOfEditorsOnServerCounter.set(this.countByRole('editor'));
		this.numberOfViewersOnServerCounter.set(this.countByRole('viewer'));
	}

	private countByRole(role: Role) {
		return Array.from(this.knownClientRoles.values()).filter((r) => r === role).length;
	}

	public setNumberOfUsers(value: number): void {
		this.numberOfUsersOnServerCounter.set(value);
	}

	public setNumberOfBoardRooms(value: number): void {
		this.numberOfBoardroomsOnServerCounter.set(value);
	}
}
