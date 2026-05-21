import { ConfigProperty, Configuration } from '@infra/configuration';
import { RabbitMQExchangeType } from '@infra/rabbitmq';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsString } from 'class-validator';

export const FILES_STORAGE_CLIENT_CONFIG_TOKEN = 'FILES_STORAGE_CLIENT_CONFIG_TOKEN';

@Configuration()
export class FilesStorageClientConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@StringToNumber()
	@IsNumber()
	public incomingTimeoutCopyApi = 60000;

	@ConfigProperty('FILES_STORAGE__EXCHANGE')
	@IsString()
	public exchangeName = 'files-storage';

	@ConfigProperty('FILES_STORAGE__EXCHANGE_TYPE')
	@IsString()
	public exchangeType = RabbitMQExchangeType.DIRECT;
}
