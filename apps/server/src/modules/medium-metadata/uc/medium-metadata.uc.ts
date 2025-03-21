import { AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataService } from '../service/medium-metadata.service';

@Injectable()
export class MediumMetadataUc {
	constructor(
		private readonly mediumMetadataService: MediumMetadataService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getMetadata(userId: EntityId, mediumId: string, mediaSourceId: string): Promise<MediumMetadataDto> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.MEDIA_SOURCE_ADMIN]);

		const metadata: MediumMetadataDto = await this.mediumMetadataService.getMetadataItem(mediumId, mediaSourceId);

		return metadata;
	}
}
