import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, IDMBetreiberApiFactory, IDMBetreiberApiInterface } from './generated';
import { VidisClientConfig } from './vidis-client-config';

@Injectable()
export class VidisClientFactory {
	private readonly baseUrl: string;

	constructor(private readonly configService: ConfigService<VidisClientConfig, true>) {
		this.baseUrl = this.configService.getOrThrow<string>('VIDIS_API_CLIENT_BASE_URL');
	}

	public createVidisClient(): IDMBetreiberApiInterface {
		const factory = IDMBetreiberApiFactory(
			new Configuration({
				basePath: this.baseUrl,
			})
		);

		return factory;
	}
}
