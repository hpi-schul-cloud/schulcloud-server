import { Injectable } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { UserService } from '@src/modules/user';
import { Gauge, Summary, register, Counter } from 'prom-client';

type ClientId = string;
type Role = 'owner' | 'editor' | 'viewer';

@Injectable()
export class MetricsService {
	private knownClientRoles: Map<ClientId, Role> = new Map();

	private numberOfBoardroomsOnServerCounter: Gauge<string>;

	public numberOfEditorsOnServerCounter: Gauge<string>;

	private numberOfViewersOnServerCounter: Gauge<string>;

	private executionTimesSummary: Map<string, Summary<string>> = new Map();

	private actionCounters: Map<string, Counter<string>> = new Map();

	constructor(private readonly userService: UserService) {
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

		register.registerMetric(this.numberOfEditorsOnServerCounter);
		register.registerMetric(this.numberOfViewersOnServerCounter);
		register.registerMetric(this.numberOfBoardroomsOnServerCounter);
	}

	private mapRole(user: UserDO): 'editor' | 'viewer' | undefined {
		const EDITOR_ROLES = [RoleName.TEACHER, RoleName.COURSESUBSTITUTIONTEACHER, RoleName.COURSETEACHER];
		if (user.roles.find((r) => EDITOR_ROLES.includes(r.name))) {
			return 'editor';
		}
		return 'viewer';
	}

	public async trackRoleOfClient(clientId: ClientId, userId: string | undefined): Promise<string | undefined> {
		let role = this.knownClientRoles.get(clientId);
		if (role === undefined && userId) {
			const userDo = await this.userService.findById(userId);
			if (userDo) {
				role = this.mapRole(userDo);
				if (role) {
					this.knownClientRoles.set(clientId, role);
					this.updateRoleCounts();
				}
			}
		}
		return role;
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

	public setNumberOfBoardRooms(value: number): void {
		this.numberOfBoardroomsOnServerCounter.set(value);
	}

	public setExecutionTime(actionName: string, value: number): void {
		let summary = this.executionTimesSummary.get(actionName);

		if (!summary) {
			summary = new Summary({
				name: `sc_boards_execution_time_${actionName}`,
				help: 'Average execution time of a specific action in milliseconds',
				maxAgeSeconds: 600,
				ageBuckets: 5,
				percentiles: [0.01, 0.1, 0.9, 0.99],
				pruneAgedBuckets: true,
			});
			this.executionTimesSummary.set(actionName, summary);
			register.registerMetric(summary);
		}
		console.log(actionName, `executionTime: ${value.toFixed(3)} ms`);
		summary.observe(value);
	}

	public incrementActionCount(actionName: string): void {
		let counter = this.actionCounters.get(actionName);

		if (!counter) {
			counter = new Counter({
				name: `sc_boards_count_${actionName}`,
				help: 'Number of calls for a specific action per minute',
				// async collect() {
				// 	// Invoked when the registry collects its metrics' values.
				// 	const currentValue = await somethingAsync();
				// 	this.set(currentValue);
				// },
			});
			this.actionCounters.set(actionName, counter);
			register.registerMetric(counter);
		}
		counter.inc();
		console.log(actionName, `count increased`);
	}
}
