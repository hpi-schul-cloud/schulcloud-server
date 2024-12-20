import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, IDMBetreiberApiFactory, IDMBetreiberApiInterface } from './generated';
import { VidisClientConfig } from './vidis-client-config';

type FactoryParams = {
	username: string;
	password: string;
};

@Injectable()
export class VidisClientFactory {
	private readonly baseUrl: string;

	constructor(private readonly configService: ConfigService<VidisClientConfig, true>) {
		this.baseUrl = configService.getOrThrow<string>('VIDIS_API_CLIENT_BASE_URL');
	}

	public createExportClient(params: FactoryParams): IDMBetreiberApiInterface {
		const factory = IDMBetreiberApiFactory(
			new Configuration({
				username: params.username,
				password: params.password,
				basePath: this.baseUrl,
			})
		);

		return factory;
	}
}
