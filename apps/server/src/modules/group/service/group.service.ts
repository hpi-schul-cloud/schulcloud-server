import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception/not-found.loggable-exception';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationLoaderServiceGeneric } from '@src/modules/authorization/types/authorization-loader-service';
import { Group } from '../domain/group';
import { GroupRepo } from '../repo/group.repo';

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

	public async findByUser(user: UserDO): Promise<Group[]> {
		const groups: Group[] = await this.groupRepo.findByUser(user);

		return groups;
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
