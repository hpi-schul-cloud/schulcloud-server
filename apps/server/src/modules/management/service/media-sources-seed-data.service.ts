import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { MediaSource, MediaSourceService } from '@modules/media-source';
import { MediaSourceAuthMethod, MediaSourceDataFormat } from '@modules/media-source/enum';
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
		let mediaSourcesCount = 0;

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

			mediaSourcesCount += 1;
		}

		const biloClientId: string | undefined = this.configService.get<string>('MEDIA_SOURCE_BILO_CLIENT_ID');
		const biloClientSecret: string | undefined = this.configService.get<string>('MEDIA_SOURCE_BILO_CLIENT_SECRET');

		if (biloClientId && biloClientSecret) {
			const encryptedBiloClientSecret: string = this.defaultEncryptionService.encrypt(biloClientSecret);

			await this.mediaSourceService.save(
				new MediaSource({
					id: '679b870e987d8f9a40c1bcbb',
					name: 'Bildungslogin',
					sourceId: 'BiloTestMediaCatalog-00001',
					format: MediaSourceDataFormat.BILDUNGSLOGIN,
					oauthConfig: {
						clientId: biloClientId,
						clientSecret: encryptedBiloClientSecret,
						authEndpoint: 'https://login.test.sso.bildungslogin.de/realms/BiLo-Broker/protocol/openid-connect/token',
						method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
					},
				})
			);

			mediaSourcesCount += 1;
		}

		return mediaSourcesCount;
	}
}
