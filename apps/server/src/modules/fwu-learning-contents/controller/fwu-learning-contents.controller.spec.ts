import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { FwuLearningContentsUc } from '../uc';
import { FwuLearningContentsController } from './fwu-learning-contents.controller';

describe('FwuLearningContents Controller', () => {
	let controller: FwuLearningContentsController;
	let fwuUcMock: DeepMocked<FwuLearningContentsUc>;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				FwuLearningContentsController,
				{
					provide: FwuLearningContentsUc,
					useValue: createMock<FwuLearningContentsUc>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		fwuUcMock = module.get(FwuLearningContentsUc);
		configServiceMock = module.get(ConfigService);
		controller = module.get(FwuLearningContentsController);
	});

	beforeEach(() => {
		fwuUcMock.get.mockClear();
	});

	describe('get file', () => {
		it('should send a file', async () => {
			const testFile = new Uint8Array([1234]);

			fwuUcMock.get.mockResolvedValueOnce(testFile);
			configServiceMock.get.mockReturnValue(true);

			const mockRequest = createMock<Request>({ params: { 0: '1234' } });
			const mockResponse = createMock<Response>();
			const mockParam = { fwuLearningContent: 'test.txt' };

			await expect(controller.get(mockRequest, mockResponse, mockParam)).resolves.toBeUndefined();
			expect(mockResponse.send).toHaveBeenCalledWith(testFile);
		});

		it('should return error if feature is disabled', async () => {
			configServiceMock.get.mockReturnValue(false);

			const mockRequest = createMock<Request>({ params: { 0: '1234' } });
			const mockResponse = createMock<Response>();
			const mockParam = { fwuLearningContent: 'test.txt' };

			await expect(controller.get(mockRequest, mockResponse, mockParam)).rejects.toThrow(
				new InternalServerErrorException('Feature FWU content is not enabled.')
			);
		});
	});
});
