import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TldrawController } from './tldraw.controller';
import { TldrawService } from '../service/tldraw.service';
import { TldrawDeleteParams } from './tldraw.params';

describe('TldrawController', () => {
	let module: TestingModule;
	let controller: TldrawController;
	let service: TldrawService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: TldrawService,
					useValue: createMock<TldrawService>(),
				},
			],
			controllers: [TldrawController],
		}).compile();

		controller = module.get(TldrawController);
		service = module.get(TldrawService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('delete', () => {
		describe('when task should be copied via API call', () => {
			const setup = () => {
				const params: TldrawDeleteParams = {
					docName: 'test-name',
				};

				const ucSpy = jest.spyOn(service, 'deleteByDocName').mockImplementation(() => Promise.resolve());
				return { params, ucSpy };
			};

			it('should call service with parentIds', async () => {
				const { params, ucSpy } = setup();
				await controller.deleteByDocName(params);
				expect(ucSpy).toHaveBeenCalledWith('test-name');
			});
		});
	});
});
