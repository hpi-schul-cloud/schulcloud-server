import { mediaSourceFactory } from '@modules/media-source/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { VidisSyncService } from '../service';
import { vidisItemResponseFactory } from '../testing';
import { VidisSyncStrategy } from './vidis-sync.strategy';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let vidisSyncStrategy: VidisSyncStrategy;
	let vidisSyncService: DeepMocked<VidisSyncService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisSyncStrategy,
				{
					provide: VidisSyncService,
					useValue: createMock<VidisSyncService>(),
				},
			],
		}).compile();

		vidisSyncStrategy = module.get(VidisSyncStrategy);
		vidisSyncService = module.get(VidisSyncService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getType', () => {
		describe('when getType is called', () => {
			it('should return vidis sync strategy target', () => {
				const result = vidisSyncStrategy.getType();

				expect(result).toEqual(SyncStrategyTarget.VIDIS);
			});
		});
	});

	describe('sync', () => {
		describe('when sync is called', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build();
				const vidisItemResponses = vidisItemResponseFactory.buildList(3);

				vidisSyncService.getVidisMediaSource.mockResolvedValueOnce(mediaSource);
				vidisSyncService.getSchoolActivationsFromVidis.mockResolvedValueOnce(vidisItemResponses);

				return {
					mediaSource,
					vidisItemResponses,
				};
			};

			it('should fetch school activations from vidis and sync them with media school licenses in svs', async () => {
				const { mediaSource, vidisItemResponses } = setup();

				await vidisSyncStrategy.sync();

				expect(vidisSyncService.getVidisMediaSource).toBeCalled();
				expect(vidisSyncService.getSchoolActivationsFromVidis).toBeCalledWith(mediaSource);
				expect(vidisSyncService.syncMediaSchoolLicenses).toBeCalledWith(mediaSource, vidisItemResponses);
			});
		});
	});
});
