import { Test, TestingModule } from '@nestjs/testing';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { EntityId } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { EtherpadService } from './etherpad.service';

describe('Etherpad service', () => {
	let module: TestingModule;
	let etherpadService: EtherpadService;
	let feathersServiceProvider: DeepMocked<FeathersServiceProvider>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				EtherpadService,
				{
					provide: FeathersServiceProvider,
					useValue: createMock<FeathersServiceProvider>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		etherpadService = module.get(EtherpadService);
		feathersServiceProvider = module.get(FeathersServiceProvider);
	});

	describe('createEtherpad', () => {
		it('it should call feathers service', async () => {
			feathersServiceProvider.getService('/etherpad/pads').create.mockResolvedValue({ data: { padID: 'padId' } });

			const userId: EntityId = new ObjectId().toHexString();

			const etherpadId = await etherpadService.createEtherpad(userId, 'courseId', 'title', 'description');
			expect(etherpadId).toEqual('padId');
		});

		it('should return false if etherpad call fails', async () => {
			feathersServiceProvider.getService('/etherpad/pads').create.mockRejectedValue({});

			const userId: EntityId = new ObjectId().toHexString();

			const etherpadId = await etherpadService.createEtherpad(userId, 'courseId', 'title', 'description');
			expect(etherpadId).toEqual(false);
		});
	});
});
