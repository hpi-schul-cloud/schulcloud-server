import { type EntityData, type EntityName } from '@mikro-orm/core';
import { type EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { type BoardImportJob, type BoardImportJobRepo } from '../../domain';
import { BoardImportJobEntity } from '../entity';
import { BoardImportJobMapper } from '../mapper';

export class BoardImportJobMikroOrmRepo
	extends BaseDomainObjectRepo<BoardImportJob, BoardImportJobEntity>
	implements BoardImportJobRepo
{
	protected get entityName(): EntityName<BoardImportJobEntity> {
		return BoardImportJobEntity;
	}

	protected mapDOToEntityProperties(entityDO: BoardImportJob): EntityData<BoardImportJobEntity> {
		const entityProps = BoardImportJobMapper.mapDOToEntityProperties(entityDO);

		return entityProps;
	}

	public async findById(id: EntityId): Promise<BoardImportJob | null> {
		const entity = await this.em.findOne(BoardImportJobEntity, { id });

		if (!entity) {
			return null;
		}

		const domainObject = BoardImportJobMapper.mapEntityToDO(entity);

		return domainObject;
	}
}
