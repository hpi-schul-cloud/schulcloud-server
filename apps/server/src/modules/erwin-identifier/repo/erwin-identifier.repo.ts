import { EntityManager, EntityName } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { ErwinIdentifier } from '../domain/do';
import { ErwinIdentifierRepo } from '../domain/interface';
import { ErwinIdentifierEntity } from './entity';
import { ErwinIdentifierMapper } from './mapper';

@Injectable()
export class ErwinIdentifierMikroOrmRepo implements ErwinIdentifierRepo {
	constructor(private readonly em: EntityManager) {}

	get entityName(): EntityName<ErwinIdentifierEntity> {
		return ErwinIdentifierEntity;
	}

	public async create(erwinIdentifier: ErwinIdentifier): Promise<void> {
		const erwinIdentifierEntity: ErwinIdentifierEntity = ErwinIdentifierMapper.mapToEntity(erwinIdentifier);

		this.em.persist(erwinIdentifierEntity);

		await this.em.flush();
	}

	public async findById(erwinIdentifierId: EntityId): Promise<ErwinIdentifier> {
		const erwinIdentifierEntity: ErwinIdentifierEntity = await this.em.findOneOrFail(ErwinIdentifierEntity, {
			id: erwinIdentifierId,
		});

		const mappedErwinIdentifier: ErwinIdentifier = ErwinIdentifierMapper.mapToDO(erwinIdentifierEntity);

		return mappedErwinIdentifier;
	}

	public async findByErwinId(erwinId: string): Promise<ErwinIdentifier | null> {
		const erwinIdentifierEntity: ErwinIdentifierEntity | null = await this.em.findOne(ErwinIdentifierEntity, {
			erwinId: erwinId,
		});

		if (!erwinIdentifierEntity) {
			return null;
		}

		const mappedErwinIdentifier: ErwinIdentifier = ErwinIdentifierMapper.mapToDO(erwinIdentifierEntity);

		return mappedErwinIdentifier;
	}

	public async findByReferencedEntityId(referencedEntityId: EntityId): Promise<ErwinIdentifier | null> {
		const erwinIdentifierEntity: ErwinIdentifierEntity | null = await this.em.findOne(ErwinIdentifierEntity, {
			referencedEntityId: referencedEntityId,
		});

		if (!erwinIdentifierEntity) {
			return null;
		}

		const mappedErwinIdentifier: ErwinIdentifier = ErwinIdentifierMapper.mapToDO(erwinIdentifierEntity);

		return mappedErwinIdentifier;
	}

	public async deleteById(erwinIdentifierId: EntityId): Promise<void> {
		const entity = await this.em.findOneOrFail(ErwinIdentifierEntity, { id: erwinIdentifierId });

		await this.em.remove(entity).flush();
	}
}
