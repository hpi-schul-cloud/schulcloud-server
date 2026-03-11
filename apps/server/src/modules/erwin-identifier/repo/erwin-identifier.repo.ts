import { EntityManager, EntityName, Utils } from '@mikro-orm/mongodb';
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

	public async create(erwinIdentifier: ErwinIdentifier | ErwinIdentifier[]): Promise<void> {
		const erwinIdentifiers = Utils.asArray(erwinIdentifier);

		erwinIdentifiers.forEach((domainObject) => {
			const erwinIdentifierEntity: ErwinIdentifierEntity = ErwinIdentifierMapper.mapToEntity(domainObject);
			this.em.persist(erwinIdentifierEntity);
		});

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
}
