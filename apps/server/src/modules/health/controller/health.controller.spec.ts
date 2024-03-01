import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { HealthUC } from '@src/modules/health/uc';
import { setupEntities } from '@shared/testing';
import { HealthController } from './health.controller';
import { HealthStatus, HealthStatuses } from '../domain';

describe(HealthController.name, () => {
	const contentTypeApplicationHealthJSON = 'application/health+json';
	const testPassedHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_PASS });
	const testFailedHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_FAIL });

	let module: TestingModule;
	let controller: HealthController;
	let uc: DeepMocked<HealthUC>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: HealthUC,
					useValue: createMock<HealthUC>(),
				},
			],
			controllers: [HealthController],
		}).compile();
		controller = module.get(HealthController);
		uc = module.get(HealthUC);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getSelfHealth', () => {
		const setup = (testHealthStatus: HealthStatus) => {
			uc.checkSelfHealth.mockReturnValueOnce(testHealthStatus);

			const mockedRes = {} as unknown as Response;
			mockedRes.contentType = jest.fn();
			mockedRes.status = jest.fn();
			const response = controller.getSelfHealth(mockedRes);

			return { response, mockedRes };
		};

		it(`should return '${HealthStatuses.STATUS_PASS}' health status in a response`, () => {
			const { response } = setup(testPassedHealthStatus);

			expect(response.status).toEqual(HealthStatuses.STATUS_PASS);
		});

		it(`should set proper Content-Type in a response`, () => {
			const { mockedRes } = setup(testPassedHealthStatus);

			expect(mockedRes.contentType).toBeCalledWith(contentTypeApplicationHealthJSON);
		});
	});

	describe('getOverallHealth', () => {
		const setup = async (testHealthStatus: HealthStatus) => {
			uc.checkOverallHealth.mockResolvedValueOnce(testHealthStatus);

			const mockedRes = {} as unknown as Response;
			mockedRes.contentType = jest.fn();
			mockedRes.status = jest.fn();
			const response = await controller.getOverallHealth(mockedRes);

			return { response, mockedRes };
		};

		describe(`in case of a '${HealthStatuses.STATUS_PASS}' health status`, () => {
			it(`should return '${HealthStatuses.STATUS_PASS}' status in a response`, async () => {
				const { response } = await setup(testPassedHealthStatus);

				expect(response.status).toEqual(HealthStatuses.STATUS_PASS);
			});

			it(`should set 200 OK HTTP status and proper Content-Type in a response`, async () => {
				const { mockedRes } = await setup(testPassedHealthStatus);

				expect(mockedRes.contentType).toBeCalledWith(contentTypeApplicationHealthJSON);
				expect(mockedRes.status).toBeCalledWith(HttpStatus.OK);
			});
		});

		describe(`in case of a '${HealthStatuses.STATUS_FAIL}' health status`, () => {
			it(`should return '${HealthStatuses.STATUS_FAIL}' status in a response`, async () => {
				const { response } = await setup(testFailedHealthStatus);

				expect(response.status).toEqual(HealthStatuses.STATUS_FAIL);
			});

			it(`should set 500 Internal Server Error HTTP status and proper Content-Type in a response`, async () => {
				const { mockedRes } = await setup(testFailedHealthStatus);

				expect(mockedRes.contentType).toBeCalledWith(contentTypeApplicationHealthJSON);
				expect(mockedRes.status).toBeCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
			});
		});
	});
});
