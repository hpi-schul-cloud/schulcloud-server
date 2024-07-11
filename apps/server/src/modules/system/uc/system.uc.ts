import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { System, SystemDeletedEvent, SystemType } from '../domain';
import { SystemService } from '../service';

@Injectable()
export class SystemUc {
	constructor(
		private readonly systemService: SystemService,
		private readonly authorizationService: AuthorizationService,
		private readonly eventBus: EventBus
	) {}

	async find(types?: SystemType[]): Promise<System[]> {
		let systems: System[] = await this.systemService.find({ types });

		systems = systems.filter((system: System) => system.ldapConfig?.active !== false);

		return systems;
	}

	async findById(systemId: EntityId): Promise<System> {
		const system: System | null = await this.systemService.findById(systemId);

		if (!system || system.ldapConfig?.active === false) {
			throw new NotFoundLoggableException(System.name, { id: systemId });
		}

		return system;
	}

	async delete(userId: EntityId, schoolId: EntityId, systemId: EntityId): Promise<void> {
		const system: System | null = await this.systemService.findById(systemId);

		if (!system) {
			throw new NotFoundLoggableException(System.name, { id: systemId });
		}

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			system,
			AuthorizationContextBuilder.write([Permission.SYSTEM_CREATE])
		);

		await this.systemService.delete(system);

		await this.eventBus.publish(new SystemDeletedEvent({ schoolId, system }));
	}
}
