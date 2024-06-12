import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { UserService } from '@src/modules/user';
import { Gauge, Histogram, linearBuckets, register } from 'prom-client';

type ClientId = string;
type Role = 'owner' | 'editor' | 'viewer';

@Injectable()
export class MetricsService {
	private knownClientRoles: Map<ClientId, Role> = new Map();

	private numberOfUsersOnServerCounter: Gauge<string>;

	private numberOfBoardroomsOnServerCounter: Gauge<string>;

	private numberOfEditorsOnServerCounter: Gauge<string>;

	private numberOfViewersOnServerCounter: Gauge<string>;

	private executionTimes: Map<string, Histogram<string>> = new Map();

	// better percentile than avg
	constructor(private readonly userService: UserService) {
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

	private mapRole(user: UserDO): 'editor' | 'viewer' | undefined {
		if (user.roles.find((r) => r.name === RoleName.TEACHER)) {
			return 'editor';
		}
		if (user.roles.find((r) => r.name === RoleName.STUDENT)) {
			return 'viewer';
		}
		return undefined;
	}

	public async trackClientRole(clientId: ClientId, userId: string | undefined): Promise<void> {
		if (userId) {
			// extract => metricsService
			if (!this.knownClientRoles.has(clientId)) {
				const userDo = await this.userService.findById(userId);
				const role = this.mapRole(userDo);
				if (role) {
					this.knownClientRoles.set(clientId, role);
					this.updateRoleCounts();
				}
			}
		}
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

	public setExecutionTime(actionName: string, value: number): void {
		let histogram = this.executionTimes.get(actionName);

		if (!histogram) {
			histogram = new Histogram({
				name: `sc_boards_execution_time_${actionName}`,
				help: '...',
				buckets: linearBuckets(0, 25, 40),
			});
			this.executionTimes.set(actionName, histogram);
			register.registerMetric(histogram);
		}
		histogram.observe(value);
	}
}
