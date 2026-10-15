import { TimeoutConfig } from '@core/interceptor/timeout-interceptor-config.interface';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber } from 'class-validator';

export const FORMER_MEMBERSHIP_TIMEOUT_CONFIG_TOKEN = 'FORMER_MEMBERSHIP_TIMEOUT_CONFIG_TOKEN';
export const FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_API_KEY =
	'formerMembershipIncomingRequestTimeoutTransferApi';
export const FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_ALL_API_KEY =
	'formerMembershipIncomingRequestTimeoutTransferAllApi';

@Configuration()
export class FormerMembershipTimeoutConfig extends TimeoutConfig {
	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_COPY_API')
	@IsNumber()
	@StringToNumber()
	public [FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_API_KEY] = 60000;

	@ConfigProperty('INCOMING_REQUEST_TIMEOUT_TRANSFER_ALL_API')
	@IsNumber()
	@StringToNumber()
	public [FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_ALL_API_KEY] = 300000;
}
