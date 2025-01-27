import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { MediaSource, MediaSourceService } from '@modules/media-source';
import { MediaSourceDataFormat } from '@modules/media-source/enum';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaSourcesSeedDataService {
	constructor(
		private readonly configService: ConfigService,
		private readonly mediaSourceService: MediaSourceService,
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: EncryptionService
	) {}

	public async import(): Promise<number> {
		const vidisUserName: string | undefined = this.configService.get<string>('MEDIA_SOURCE_VIDIS_USERNAME');
		const vidisPassword: string | undefined = this.configService.get<string>('MEDIA_SOURCE_VIDIS_PASSWORD');

		if (vidisUserName && vidisPassword) {
			const encryptedVidisUserName: string = this.defaultEncryptionService.encrypt(vidisUserName);
			const encryptedVidisPassword: string = this.defaultEncryptionService.encrypt(vidisPassword);

			await this.mediaSourceService.save(
				new MediaSource({
					id: '675b0b71553441da9a893bf9',
					name: 'VIDIS',
					sourceId: 'vidis.fwu.de',
					format: MediaSourceDataFormat.VIDIS,
					vidisConfig: {
						username: encryptedVidisUserName,
						password: encryptedVidisPassword,
						baseUrl: 'https://service-stage.vidis.schule/o/vidis-rest',
						region: 'test-region',
					},
				})
			);

			return 1;
		}

		return 0;
	}
}
