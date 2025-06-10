import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataService } from '@modules/medium-metadata';
import { ExternalToolService } from '@modules/tool';
import { ExternalToolValidationService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common';
import { ExternalToolMetadataUpdateService } from '../external-tool-metadata-update.service';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

@Injectable()
export class VidisMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService,
		protected readonly externalToolValidationService: ExternalToolValidationService,
		protected readonly externalToolMetadataUpdateService: ExternalToolMetadataUpdateService
	) {
		super(externalToolService, mediumMetadataService, externalToolValidationService, externalToolMetadataUpdateService);
	}

	public override getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.VIDIS;
	}
}
