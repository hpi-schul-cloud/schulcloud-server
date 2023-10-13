import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import NodeClam from 'clamscan';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';
import { AntivirusService } from './antivirus.service';

describe('AntivirusService', () => {
	let module: TestingModule;
	let service: AntivirusService;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let clamavConnection: DeepMocked<NodeClam>;

	const antivirusServiceOptions = {
		enabled: true,
		filesServiceBaseUrl: 'http://localhost',
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AntivirusService,
				{ provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
				{ provide: NodeClam, useValue: createMock<NodeClam>() },
				{ provide: 'ANTIVIRUS_SERVICE_OPTIONS', useValue: antivirusServiceOptions },
			],
		}).compile();

		service = module.get(AntivirusService);
		amqpConnection = module.get(AmqpConnection);
		clamavConnection = module.get(NodeClam);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('send', () => {
		describe('when service can handle passing parameters', () => {
			const setup = () => {
				const requestToken = uuid();

				const expectedParams = [
					antivirusServiceOptions.exchange,
					antivirusServiceOptions.routingKey,
					{
						callback_uri: `http://localhost/api/v3/file-security/update-status/${requestToken}`,
						download_uri: `http://localhost/api/v3/file-security/download/${requestToken}`,
					},

					{ persistent: true },
				];

				return { requestToken, expectedParams };
			};

			it('should send given data to queue', async () => {
				const { requestToken, expectedParams } = setup();

				await service.send(requestToken);

				expect(amqpConnection.publish).toHaveBeenCalledWith(...expectedParams);
			});
		});

		describe('when amqpConnection throws an error', () => {
			const setup = () => {
				const requestToken = uuid();

				amqpConnection.publish.mockRejectedValueOnce(new Error('fail'));

				return { requestToken };
			};

			it('should throw with InternalServerErrorException by error', async () => {
				const { requestToken } = setup();

				await expect(() => service.send(requestToken)).rejects.toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('checkStream', () => {
		describe('when service can handle passing parameters', () => {
			const setup = () => {
				const readable = Readable.from('abc');

				return { readable };
			};

			it('should call scanStream', async () => {
				const { readable } = setup();

				await service.checkStream(readable);

				expect(clamavConnection.scanStream).toHaveBeenCalledWith(readable);
			});
		});

		describe('when file infected', () => {
			const setup = () => {
				const readable = Readable.from('abc');
				// @ts-expect-error unknown types
				clamavConnection.scanStream.mockResolvedValueOnce({ isInfected: true, viruses: ['test'] });

				const expectedResult = {
					virus_detected: true,
					virus_signature: 'test',
				};
				return { readable, expectedResult };
			};

			it('should return scan result', async () => {
				const { readable, expectedResult } = setup();

				const result = await service.checkStream(readable);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when file not scanned', () => {
			const setup = () => {
				const readable = Readable.from('abc');
				// @ts-expect-error unknown types
				clamavConnection.scanStream.mockResolvedValueOnce({ isInfected: null });

				const expectedResult = {
					virus_detected: undefined,
					virus_signature: undefined,
					error: '',
				};
				return { readable, expectedResult };
			};

			it('should return scan result', async () => {
				const { readable, expectedResult } = setup();

				const result = await service.checkStream(readable);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when file is good', () => {
			const setup = () => {
				const readable = Readable.from('abc');
				// @ts-expect-error unknown types
				clamavConnection.scanStream.mockResolvedValueOnce({ isInfected: false });

				const expectedResult = {
					virus_detected: false,
				};
				return { readable, expectedResult };
			};

			it('should return scan result', async () => {
				const { readable, expectedResult } = setup();

				const result = await service.checkStream(readable);

				expect(result).toEqual(expectedResult);
			});
		});

		describe('when clamavConnection.scanStream throw an error', () => {
			const setup = () => {
				const readable = Readable.from('abc');
				// @ts-expect-error unknown types
				clamavConnection.scanStream.mockRejectedValueOnce(new Error('fail'));

				return { readable };
			};

			it('should throw with InternalServerErrorException by error', async () => {
				const { readable } = setup();

				await expect(() => service.checkStream(readable)).rejects.toThrowError(InternalServerErrorException);
			});
		});
	});
});
