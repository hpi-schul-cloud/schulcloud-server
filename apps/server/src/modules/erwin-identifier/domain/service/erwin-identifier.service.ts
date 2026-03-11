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
			new ErwinIdentifierLoggable('An erwinId entry was created.', {
				erwinId: erwinIdentifier.erwinId,
				type: erwinIdentifier.type,
				referencedEntityId: erwinIdentifier.referencedEntityId,
			})
		);
		return erwinIdentifier;
	}
}
