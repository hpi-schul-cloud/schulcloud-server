import { IdentityManagementService } from '@infra/identity-management';
import { ServerConfig } from '@modules/server/server.config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * Service to convert between internal and external ids.
 * The external ids are the primary keys from the IDM (Keycloak), currently they are UUID formatted strings.
 * The internal ids are the primary keys from the mongo db, currently they are BSON object ids or their hex string representation.
 * IMPORTANT: This service will not guarantee that the id is valid, it will only try to convert it.
 */
@Injectable()
export class AccountLookupService {
	constructor(
		private readonly idmService: IdentityManagementService,
		private readonly configService: ConfigService<ServerConfig, true>
	) {}

	/**
	 * Converts an external id to the internal id, if the id is already an internal id, it will be returned as is.
	 * IMPORTANT: This method will not guarantee that the id is valid, it will only try to convert it.
	 * @param id the id the should be converted to the internal id.
	 * @returns the converted id or null if conversion failed.
	 */
	async getInternalId(id: EntityId | ObjectId): Promise<ObjectId | null> {
		if (id instanceof ObjectId || ObjectId.isValid(id)) {
			return new ObjectId(id);
		}
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			const account = await this.idmService.findAccountById(id);
			return new ObjectId(account.attDbcAccountId);
		}
		return null;
	}

	/**
	 * Converts an internal id to the external id, if the id is already an external id, it will be returned as is.
	 * IMPORTANT: This method will not guarantee that the id is valid, it will only try to convert it.
	 * @param id the id the should be converted to the external id.
	 * @returns the converted id or null if conversion failed.
	 */
	async getExternalId(id: EntityId | ObjectId): Promise<string | null> {
		if (!(id instanceof ObjectId) && !ObjectId.isValid(id)) {
			return id;
		}
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			const account = await this.idmService.findAccountByDbcAccountId(id.toString());
			return account.id;
		}
		return null;
	}
}
