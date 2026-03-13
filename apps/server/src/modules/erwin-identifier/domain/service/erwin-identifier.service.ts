import { Logger } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ReferencedEntityType } from '../../types';
import { ErwinIdentifier } from '../do';
import { ErwinIdentifierRepo } from '../interface';
import { ErwinIdentifierLoggable } from '../loggable';

export type ErwinIdentifierEntry = {
	erwinId: string;
	type: ReferencedEntityType;
	referencedEntityId: EntityId;
};

@Injectable()
export class ErwinIdentifierService {
	constructor(private readonly logger: Logger, private readonly erwinIdentifierRepo: ErwinIdentifierRepo) {
		logger.setContext(ErwinIdentifierService.name);
	}

	public async createErwinIdentifier(entry: ErwinIdentifierEntry): Promise<ErwinIdentifier> {
		const erwinIdentifier = new ErwinIdentifier({
			id: new ObjectId().toHexString(),
			erwinId: entry.erwinId,
			type: entry.type,
			referencedEntityId: entry.referencedEntityId,
		});

		await this.erwinIdentifierRepo.create(erwinIdentifier);
		this.logger.info(
			new ErwinIdentifierLoggable('An erwinIdentifier entry was created.', {
				erwinId: erwinIdentifier.erwinId,
				type: erwinIdentifier.type,
				referencedEntityId: erwinIdentifier.referencedEntityId,
			})
		);
		return erwinIdentifier;
	}

	public async findByErwinId(erwinId: string): Promise<ErwinIdentifier | null> {
		const erwinIdentifier = await this.erwinIdentifierRepo.findByErwinId(erwinId);

		if (!erwinIdentifier) {
			return null;
		}

		this.logger.info(
			new ErwinIdentifierLoggable('ErwinIdentifier entry was fetched by erwinId.', {
				erwinId: erwinIdentifier.erwinId,
				type: erwinIdentifier.type,
				referencedEntityId: erwinIdentifier.referencedEntityId,
			})
		);

		return erwinIdentifier;
	}

	public async findByReferencedEntityId(referencedEntityId: EntityId): Promise<ErwinIdentifier | null> {
		const erwinIdentifier = await this.erwinIdentifierRepo.findByReferencedEntityId(referencedEntityId);

		if (!erwinIdentifier) {
			return null;
		}

		this.logger.info(
			new ErwinIdentifierLoggable('ErwinIdentifier entry was fetched by referencedEntityId.', {
				erwinId: erwinIdentifier.erwinId,
				type: erwinIdentifier.type,
				referencedEntityId: erwinIdentifier.referencedEntityId,
			})
		);

		return erwinIdentifier;
	}
}
