import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { LegacyLogger } from '@src/core/logger';
import { EtherpadService } from './etherpad.service';

describe('Etherpad service', () => {
	let module: TestingModule;
	let etherpadService: EtherpadService;
	let feathersServiceProvider: DeepMocked<FeathersServiceProvider>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				EtherpadService,
				{
					provide: FeathersServiceProvider,
					useValue: createMock<FeathersServiceProvider>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		etherpadService = module.get(EtherpadService);
		feathersServiceProvider = module.get(FeathersServiceProvider);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createEtherpad', () => {
		it('it should call feathers service', async () => {
			feathersServiceProvider.getService('/etherpad/pads').create.mockResolvedValue({ data: { padID: 'padId' } });

			const userId: EntityId = new ObjectId().toHexString();

			const etherpadId = await etherpadService.createEtherpad(userId, 'courseId', 'title');
			expect(etherpadId).toEqual('padId');
		});

		it('should return false if etherpad call fails', async () => {
			feathersServiceProvider.getService('/etherpad/pads').create.mockRejectedValue({});

			const userId: EntityId = new ObjectId().toHexString();

			const etherpadId = await etherpadService.createEtherpad(userId, 'courseId', 'title');
			expect(etherpadId).toEqual(false);
		});
	});
});
