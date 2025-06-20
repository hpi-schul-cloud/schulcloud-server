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
		const mediaSources: MediaSource[] = [];

		const vidisUserName: string | undefined = 'some_user'; //this.configService.get<string>('MEDIA_SOURCE_VIDIS_USERNAME');
		const vidisPassword: string | undefined = 'some_pass'; //this.configService.get<string>('MEDIA_SOURCE_VIDIS_PASSWORD');
		if (vidisUserName && vidisPassword) {
			const encryptedVidisUserName: string = this.defaultEncryptionService.encrypt(vidisUserName);
			const encryptedVidisPassword: string = this.defaultEncryptionService.encrypt(vidisPassword);

			mediaSources.push(
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
						schoolNumberPrefix: 'DE-VIDIS-vidis_test_',
					},
				})
			);
		}

		const biloClientId: string | undefined = this.configService.get<string>('MEDIA_SOURCE_BILO_CLIENT_ID');
		const biloClientSecret: string | undefined = this.configService.get<string>('MEDIA_SOURCE_BILO_CLIENT_SECRET');
		if (biloClientId && biloClientSecret) {
			const encryptedBiloClientSecret: string = this.defaultEncryptionService.encrypt(biloClientSecret);

			mediaSources.push(
				new MediaSource({
					id: '679b870e987d8f9a40c1bcbb',
					name: 'Bildungslogin',
					sourceId: 'https://www.bildungslogin-test.de/api/external/univention/media',
					format: MediaSourceDataFormat.BILDUNGSLOGIN,
					oauthConfig: {
						clientId: biloClientId,
						clientSecret: encryptedBiloClientSecret,
						authEndpoint: 'https://login.test.sso.bildungslogin.de/realms/BiLo-Broker/protocol/openid-connect/token',
						method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
						baseUrl: 'https://www.bildungslogin-test.de/api/external/univention/media',
					},
				})
			);
		}

		if (mediaSources.length > 0) {
			await this.mediaSourceService.saveAll(mediaSources);
		}

		return mediaSources.length;
	}
}
