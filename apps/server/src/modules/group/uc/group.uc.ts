import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ClassService } from '@src/modules/class';
import { Class } from '@src/modules/class/domain';
import { SystemDto, SystemService } from '@src/modules/system';
import { Group } from '../domain';
import { GroupService } from '../service';
import { ClassInfoDto } from './dto/class-info.dto';
import { GroupUcMapper } from './mapper/group-uc.mapper';

@Injectable()
export class GroupUc {
	constructor(
		private readonly groupService: GroupService,
		private readonly classService: ClassService,
		private readonly systemService: SystemService
	) {}

	public async findClassesForSchool(schoolId: EntityId): Promise<ClassInfoDto[]> {
		const classes: Class[] = await this.classService.findClassesForSchool(schoolId);
		const groupsOfTypeClass: Group[] = await this.groupService.findClassesForSchool(schoolId);

		const systemMap: Map<EntityId, SystemDto> = await this.findSystemNamesForGroups(groupsOfTypeClass);

		const classInfosFromGroups: ClassInfoDto[] = groupsOfTypeClass.map((group: Group): ClassInfoDto => {
			let system: SystemDto | undefined;
			if (group.externalSource) {
				system = systemMap.get(group.externalSource.systemId);
			}

			const mapped = GroupUcMapper.mapGroupToClassInfoDto(group, system);

			return mapped;
		});

		const classInfosFromClasses: ClassInfoDto[] = classes.map((clazz: Class): ClassInfoDto => {
			const mapped = GroupUcMapper.mapClassToClassInfoDto(clazz);

			return mapped;
		});

		const combinedClassInfo: ClassInfoDto[] = [...classInfosFromGroups, ...classInfosFromClasses];

		// TODO pagination

		return combinedClassInfo;
	}

	private async findSystemNamesForGroups(groups: Group[]): Promise<Map<EntityId, SystemDto>> {
		const systemIds: EntityId[] = groups
			.map((group: Group): string | undefined => group.externalSource?.systemId)
			.filter((systemId: string | undefined): systemId is EntityId => systemId !== undefined);

		const uniqueSystemIds: EntityId[] = Array.from(new Set(systemIds));

		const systems: Map<EntityId, SystemDto> = new Map<EntityId, SystemDto>();

		await Promise.all(
			uniqueSystemIds.map(async (systemId: string) => {
				const system: SystemDto = await this.systemService.findById(systemId);

				systems.set(systemId, system);
			})
		);

		return systems;
	}
}
