import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain';
import { AuthorizationLoaderServiceGeneric } from '@src/modules/authorization';
import { Group } from '../domain';
import { GroupRepo } from '../repo';

@Injectable()
export class GroupService implements AuthorizationLoaderServiceGeneric<Group> {
	constructor(private readonly groupRepo: GroupRepo) {}

	public async findById(id: EntityId): Promise<Group> {
		const group: Group | null = await this.groupRepo.findById(id);

		if (!group) {
			throw new NotFoundLoggableException(Group.name, 'id', id);
		}

		return group;
	}

	public async tryFindById(id: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findById(id);

		return group;
	}

	public async findByExternalSource(externalId: string, systemId: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findByExternalSource(externalId, systemId);

		return group;
	}

	public async findClassesForSchool(schoolId: EntityId): Promise<Group[]> {
		const group: Group[] = await this.groupRepo.findClassesForSchool(schoolId);

		return group;
	}

	public async save(group: Group): Promise<Group> {
		const savedGroup: Group = await this.groupRepo.save(group);

		return savedGroup;
	}

	public async delete(group: Group): Promise<void> {
		await this.groupRepo.delete(group);
	}
}
