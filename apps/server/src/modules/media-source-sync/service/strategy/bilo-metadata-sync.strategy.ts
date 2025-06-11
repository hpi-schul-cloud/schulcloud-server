import { MediaSourceDataFormat } from '@modules/media-source';
import { MediumMetadataService } from '@modules/medium-metadata';
import {
	ExternalToolService,
	ExternalToolValidationService,
	ExternalToolParameterValidationService,
} from '@modules/tool';
import { Injectable } from '@nestjs/common';
import { ExternalToolMetadataUpdateService } from '../external-tool-metadata-update.service';
import { BaseMetadataSyncStrategy } from './base-metadata-sync.strategy';

@Injectable()
export class BiloMetadataSyncStrategy extends BaseMetadataSyncStrategy {
	constructor(
		protected readonly externalToolService: ExternalToolService,
		protected readonly mediumMetadataService: MediumMetadataService,
		protected readonly externalToolValidationService: ExternalToolValidationService,
		protected readonly externalToolMetadataUpdateService: ExternalToolMetadataUpdateService,
		protected readonly externalToolParameterValidationService: ExternalToolParameterValidationService
	) {
		super(
			externalToolService,
			mediumMetadataService,
			externalToolValidationService,
			externalToolMetadataUpdateService,
			externalToolParameterValidationService
		);
	}

	public override getMediaSourceFormat(): MediaSourceDataFormat {
		return MediaSourceDataFormat.BILDUNGSLOGIN;
	}
}
