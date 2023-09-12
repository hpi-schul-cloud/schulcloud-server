import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain';
import { AuthorizationLoaderServiceGeneric } from '@src/modules/authorization';
import { Group } from '../domain';
import { GroupRepo } from '../repo';

@Injectable()
export class GroupService implements AuthorizationLoaderServiceGeneric<Group> {
	constructor(private readonly groupRepo: GroupRepo) {}

	async findById(id: EntityId): Promise<Group> {
		const group: Group | null = await this.groupRepo.findById(id);

		if (!group) {
			throw new NotFoundLoggableException(Group.name, 'id', id);
		}

		return group;
	}

	async findByExternalSource(externalId: string, systemId: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findByExternalSource(externalId, systemId);

		return group;
	}

	async tryFindById(id: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findById(id);

		return group;
	}

	async save(group: Group): Promise<Group> {
		const savedGroup: Group = await this.groupRepo.save(group);

		return savedGroup;
	}

	async delete(group: Group): Promise<void> {
		await this.groupRepo.delete(group);
	}
}
