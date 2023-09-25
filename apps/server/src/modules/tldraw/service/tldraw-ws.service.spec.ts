import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { axiosResponseFactory, cleanupCollections } from '@shared/testing';
import { TldrawWsService } from '@src/modules/tldraw/service/tldraw-ws.service';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { of } from 'rxjs';
import { TldrawDrawing } from '../entities';
import { TldrawRepo } from '../repo/tldraw.repo';
import { TldrawService } from './tldraw.service';

describe(TldrawService.name, () => {
	let module: TestingModule;
	let service: TldrawWsService;
	let httpService: DeepMocked<HttpService>;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] })],
			providers: [
				TldrawRepo,
				TldrawWsService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		service = module.get(TldrawWsService);
		httpService = module.get(HttpService);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		jest.resetAllMocks();
	});

	describe('authorize', () => {
		describe('when checking user permission for drawing', () => {
			const setup = () => {
				const axiosResponse = axiosResponseFactory.build({
					status: 204,
				});
				return { axiosResponse };
			};

			it('should properly call server side via http service', async () => {
				const { axiosResponse } = setup();

				const methodParams = { drawingName: 'test-name', token: 'test-token' };
				httpService.get.mockReturnValue(of(axiosResponse));
				await service.authorizeConnection(methodParams.drawingName, methodParams.token);

				expect(httpService.get).toHaveBeenCalled();
			});
		});
	});
});
