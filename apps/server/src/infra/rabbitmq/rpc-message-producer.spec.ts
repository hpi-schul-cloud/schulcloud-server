import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ErrorMapper, RpcMessageProducer } from '.';

interface TestPayload {
	value: boolean;
}

interface TestResponse {
	value: boolean;
}

const TestEvent = 'test-event';
const TestExchange = 'test-exchange';
const timeout = 1000;

class RpcMessageProducerImp extends RpcMessageProducer {
	constructor(protected readonly amqpConnection: AmqpConnection) {
		super(amqpConnection, TestExchange, timeout);
	}

	async testRequest(payload: TestPayload): Promise<TestResponse> {
		const response = await this.request<TestResponse>(TestEvent, payload);

		return response;
	}
}

describe('RpcMessageProducer', () => {
	let service: RpcMessageProducerImp;
	let amqpConnection: DeepMocked<AmqpConnection>;

	beforeAll(() => {
		amqpConnection = createMock<AmqpConnection>();

		service = new RpcMessageProducerImp(amqpConnection);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('generate', () => {
		describe('when valid params are passed and amqp connection return with a message', () => {
			const setup = () => {
				const params: TestPayload = {
					value: true,
				};

				const message = [];
				amqpConnection.request.mockResolvedValueOnce({ message });

				const expectedParams = {
					exchange: TestExchange,
					routingKey: TestEvent,
					payload: params,
					timeout,
					expiration: timeout * 1.5,
				};

				return { params, expectedParams, message };
			};

			it('should call the ampqConnection.', async () => {
				const { params, expectedParams } = setup();

				await service.testRequest(params);

				expect(amqpConnection.request).toHaveBeenCalledWith(expectedParams);
			});

			it('should return the response message.', async () => {
				const { params, message } = setup();

				const res = await service.testRequest(params);

				expect(res).toEqual(message);
			});
		});

		describe('when amqpConnection return with error in response', () => {
			const setup = () => {
				const params: TestPayload = {
					value: true,
				};

				const error = new Error('An error from called service');

				amqpConnection.request.mockResolvedValueOnce({ error });
				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { params, spy, error };
			};

			it('should call error mapper and throw with error', async () => {
				const { params, spy, error } = setup();

				await expect(service.testRequest(params)).rejects.toThrowError(
					ErrorMapper.mapRpcErrorResponseToDomainError(error)
				);
				expect(spy).toBeCalled();
			});
		});

		describe('when amqpConnection throw an error', () => {
			const setup = () => {
				const params: TestPayload = {
					value: true,
				};

				const error = new Error('An error from called service');

				amqpConnection.request.mockRejectedValueOnce(error);
				const spy = jest.spyOn(ErrorMapper, 'mapRpcErrorResponseToDomainError');

				return { params, spy, error };
			};

			it('should call error mapper and throw with error', async () => {
				const { params, spy, error } = setup();

				await expect(service.testRequest(params)).rejects.toThrowError(error);
				expect(spy).not.toBeCalled();
			});
		});
	});
});
