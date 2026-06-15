import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnectionGuard } from './amqp-connection-guard.service';
import { AmqpConnectionLostLoggable } from './loggable';

describe('AmqpConnectionGuard', () => {
	let module: TestingModule;
	let guard: AmqpConnectionGuard;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let logger: DeepMocked<Logger>;
	let processExitSpy: jest.SpyInstance;

	const createMockManagedConnection = () => {
		const listeners = new Map<string, ((...args: unknown[]) => void)[]>();

		return {
			on: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
				const eventListeners = listeners.get(event) ?? [];
				eventListeners.push(callback);
				listeners.set(event, eventListeners);
			}),
			emit: (event: string, ...args: unknown[]) => {
				const eventListeners = listeners.get(event) ?? [];
				eventListeners.forEach((cb) => cb(...args));
			},
		};
	};

	let mockManagedConnection: ReturnType<typeof createMockManagedConnection>;

	beforeEach(async () => {
		mockManagedConnection = createMockManagedConnection();

		amqpConnection = createMock<AmqpConnection>({
			managedConnection: mockManagedConnection,
		});

		module = await Test.createTestingModule({
			providers: [
				AmqpConnectionGuard,
				{
					provide: AmqpConnection,
					useValue: amqpConnection,
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		guard = module.get(AmqpConnectionGuard);
		logger = module.get(Logger);
		processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
	});

	afterEach(() => {
		jest.resetAllMocks();
		processExitSpy.mockRestore();
	});

	it('should be defined', () => {
		expect(guard).toBeDefined();
	});

	describe('onModuleInit', () => {
		it('should set up disconnect listener', () => {
			guard.onModuleInit();

			expect(mockManagedConnection.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
		});

		it('should set up connectFailed listener', () => {
			guard.onModuleInit();

			expect(mockManagedConnection.on).toHaveBeenCalledWith('connectFailed', expect.any(Function));
		});
	});

	describe('when connection is lost (disconnect event)', () => {
		const setup = () => {
			const error = new Error('Connection lost');

			guard.onModuleInit();

			return { error };
		};

		it('should log the error', () => {
			const { error } = setup();

			mockManagedConnection.emit('disconnect', { err: error });

			expect(logger.warning).toHaveBeenCalledWith(expect.any(AmqpConnectionLostLoggable));
		});

		it('should call process.exit with exit code 1', () => {
			const { error } = setup();

			mockManagedConnection.emit('disconnect', { err: error });

			expect(processExitSpy).toHaveBeenCalledWith(1);
		});

		describe('when error is undefined', () => {
			it('should use a default error message', () => {
				setup();

				mockManagedConnection.emit('disconnect', {});

				expect(logger.warning).toHaveBeenCalledWith(expect.any(AmqpConnectionLostLoggable));
				expect(processExitSpy).toHaveBeenCalledWith(1);
			});
		});
	});

	describe('when connection fails (connectFailed event)', () => {
		const setup = () => {
			const error = new Error('Failed to connect');

			guard.onModuleInit();

			return { error };
		};

		it('should log the error', () => {
			const { error } = setup();

			mockManagedConnection.emit('connectFailed', { err: error });

			expect(logger.warning).toHaveBeenCalledWith(expect.any(AmqpConnectionLostLoggable));
		});

		it('should call process.exit with exit code 1', () => {
			const { error } = setup();

			mockManagedConnection.emit('connectFailed', { err: error });

			expect(processExitSpy).toHaveBeenCalledWith(1);
		});
	});
});
