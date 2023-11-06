import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { MetaData, MetaTagExtractorService } from '../service';

@Injectable()
export class MetaTagExtractorUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly metaTagExtractorService: MetaTagExtractorService
	) {}

	async fetchMetaData(userId: EntityId, url: string): Promise<MetaData> {
		try {
			await this.authorizationService.getUserWithPermissions(userId);
		} catch (error) {
			throw new UnauthorizedException();
		}

		const result = await this.metaTagExtractorService.fetchMetaData(url);
		return result;
	}
}
