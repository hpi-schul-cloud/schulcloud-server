import { type AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ErrorMapper } from './error.mapper';
import { type RpcMessage } from './rpc-message';

export abstract class RpcMessageProducer {
	constructor(
		protected readonly amqpConnection: AmqpConnection,
		protected readonly exchange: string,
		protected readonly timeout: number
	) {}

	protected async request<T>(event: string, payload: unknown): Promise<T> {
		const response = await this.amqpConnection.request<RpcMessage<T>>(this.createRequest(event, payload));

		this.checkError<T>(response);
		return response.message;
	}

	// need to be fixed with https://ticketsystem.dbildungscloud.de/browse/BC-2984
	// mapRpcErrorResponseToDomainError should also removed with this ticket
	protected checkError<T>(response: RpcMessage<T>): void {
		const { error } = response;
		if (error) {
			const domainError = ErrorMapper.mapRpcErrorResponseToDomainError(error);
			throw domainError;
		}
	}

	protected createRequest(
		event: string,
		payload: unknown
	): {
		exchange: string;
		routingKey: string;
		payload: unknown;
		timeout: number;
		expiration: number | undefined;
	} {
		// expiration should be greater than timeout
		const expiration = this.timeout > 0 ? this.timeout * 1.5 : undefined;

		return {
			exchange: this.exchange,
			routingKey: event,
			payload,
			timeout: this.timeout,
			expiration,
		};
	}
}
