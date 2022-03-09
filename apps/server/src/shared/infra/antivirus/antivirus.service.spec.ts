import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecord, FileRecordParentType } from '@shared/domain';
import { AntivirusService } from './antivirus.service';

describe('AntivirusService', () => {
	let service: AntivirusService;
	let amqpConnection: DeepMocked<AmqpConnection>;

	const antivirusServiceOptions = {
		enabled: true,
		filesServiceBaseUrl: 'http://localhost',
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AntivirusService,
				{ provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
				{ provide: 'ANTIVIRUS_SERVICE_OPTIONS', useValue: antivirusServiceOptions },
			],
		}).compile();

		service = module.get(AntivirusService);
		amqpConnection = module.get(AmqpConnection);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('send()', () => {
		it('should send given data to queue', async () => {
			const fileRecord = new FileRecord({
				size: 100,
				name: 'test.txt',
				mimeType: 'text/plain',
				creatorId: '620abb23697023333eadea01',
				schoolId: '620abb23697023333eadea00',
				parentId: '620abb23697023333eadea00',
				parentType: FileRecordParentType.School,
			});
			fileRecord.securityCheck.requestToken = 'test-token';
			await service.send(fileRecord);
			const expectedParams = [
				antivirusServiceOptions.exchange,
				antivirusServiceOptions.routingKey,
				{
					callback_uri: 'http://localhost/api/v3/file-security/update-status/test-token',
					download_uri: 'http://localhost/api/v3/file-security/download/test-token',
				},

				{ persistent: true },
			];
			expect(amqpConnection.publish).toHaveBeenCalledWith(...expectedParams);
		});
	});
});
