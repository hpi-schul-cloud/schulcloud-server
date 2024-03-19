import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { SystemEntity, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId, SystemTypeEnum } from '@shared/domain/types';
import { System, SystemType } from '../domain';
import { LegacySystemService, SystemDto, SystemService } from '../service';

@Injectable()
export class SystemUc {
	constructor(
		private readonly legacySystemService: LegacySystemService,
		private readonly systemService: SystemService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService
	) {}

	async findByFilter(type?: SystemTypeEnum, onlyOauth = false): Promise<SystemDto[]> {
		let systems: SystemDto[];

		if (onlyOauth) {
			systems = await this.legacySystemService.findByType(SystemTypeEnum.OAUTH);
		} else {
			systems = await this.legacySystemService.findByType(type);
		}

		systems = systems.filter((system: SystemDto) => system.ldapActive !== false);

		return systems;
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const system: SystemDto = await this.legacySystemService.findById(id);

		if (system.ldapActive === false) {
			throw new EntityNotFoundError(SystemEntity.name, { id });
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

		await this.removeSystemFromSchool(schoolId, system);
	}

	private async removeSystemFromSchool(schoolId: string, system: System) {
		const school: LegacySchoolDo = await this.schoolService.getSchoolById(schoolId);

		school.systems = school.systems?.filter((schoolSystemId: string) => schoolSystemId !== system.id);
		school.ldapLastSync = undefined;

		if (system.type === SystemType.LDAP && school.systems?.length === 0) {
			school.externalId = undefined;
		}

		await this.schoolService.save(school);
	}
}
