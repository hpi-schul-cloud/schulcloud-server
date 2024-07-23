import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ErrorMapper } from './error.mapper';
import { RpcMessage } from './rpc-message';

export abstract class RpcMessageProducer {
	constructor(
		protected readonly amqpConnection: AmqpConnection,
		protected readonly exchange: string,
		protected readonly timeout: number
	) {}

	protected async request<T>(event: string, payload: unknown) {
		const response = await this.amqpConnection.request<RpcMessage<T>>(this.createRequest(event, payload));

		this.checkError<T>(response);
		return response.message;
	}

	// need to be fixed with https://ticketsystem.dbildungscloud.de/browse/BC-2984
	// mapRpcErrorResponseToDomainError should also removed with this ticket
	protected checkError<T>(response: RpcMessage<T>) {
		const { error } = response;
		if (error) {
			const domainError = ErrorMapper.mapRpcErrorResponseToDomainError(error);
			throw domainError;
		}
	}

	protected createRequest(event: string, payload: unknown) {
		// expiration should be greater than timeout
		const expiration = this.timeout > 0 ? this.timeout / 0.5 + this.timeout : undefined;

		return {
			exchange: this.exchange,
			routingKey: event,
			payload,
			timeout: this.timeout,
			expiration,
		};
	}
}
