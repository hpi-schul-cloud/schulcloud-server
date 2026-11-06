import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { SchulcloudTheme } from '@shared/domain/types';
import type { Server } from 'node:net';
import { of } from 'rxjs';
import request from 'supertest';
import { ServerTestModule } from '../../../server';
import { type ComponentDto, ComponentResponse, IncidentsResponse } from '../../adapter/dto';
import { createComponent, createIncident } from '../../testing';
import { type AlertResponse } from '../dto';
import { ALERT_CONFIG, type AlertConfig } from '../../alert.config';

describe('Alert Controller api', () => {
	const alertPath = '/alert';
	const incidentsPath = '/api/v1/incidents';
	const componentsPath = '/api/v1/components/';
	const incident1 = createIncident(1, 0, 2);
	const incident2 = createIncident(2, 1, 0);
	const incident3 = createIncident(3, 2, 4);
	const incident4 = createIncident(4, 2, 1);
	const component1 = createComponent(1, 1);
	const component2 = createComponent(2, 2);

	let app: INestApplication<Server>;
	let httpService: DeepMocked<HttpService>;
	let config: AlertConfig;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(ALERT_CONFIG)
			.useValue({
				alertStatusUrl: 'https://status.example.test',
				alertCacheIntervalMin: 1,
				scTheme: SchulcloudTheme.DEFAULT,
			} satisfies AlertConfig)
			.overrideProvider(HttpService)
			.useValue(createMock<HttpService>())
			.compile();
		app = module.createNestApplication();
		await app.init();
		httpService = module.get(HttpService);
		config = module.get(ALERT_CONFIG);
	});

	afterEach(async () => {
		await app.close();
	});

	describe('[GET]', () => {
		describe('when no incidents', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockImplementation(() => {
					const response = axiosResponseFactory.build({ data: [] });
					return of(response);
				});
			};

			it('should return empty alert list', async () => {
				setup();
				const response = await request(app.getHttpServer()).get(alertPath).expect(200);

				const { data } = response.body as AlertResponse;
				expect(data.length).toBe(0);
			});
		});

		describe('when incidents available', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockImplementation((url) => {
					if (url.match(incidentsPath)) {
						const incidents = [incident1, incident2, incident3, incident4].map((incident, index) => {
							return {
								...incident,
								name: `incident-${index + 1}`,
							};
						});
						const incidentResponse = new IncidentsResponse(incidents);
						const response = axiosResponseFactory.build({ data: incidentResponse });
						return of(response);
					}

					if (url.match(componentsPath)) {
						const componentId = url.at(-1);
						let component: ComponentDto;
						if (componentId === '1') {
							component = component1;
						} else {
							component = component2;
						}
						const componentResponse = new ComponentResponse(component);
						const response = axiosResponseFactory.build({ data: componentResponse });
						return of(response);
					}
					const response = axiosResponseFactory.build({ data: [] });
					return of(response);
				});
			};

			it.each([
				{ theme: SchulcloudTheme.DEFAULT, titles: ['incident-2', 'incident-1'] },
				{ theme: SchulcloudTheme.BRANDENBURG, titles: ['incident-4', 'incident-1'] },
				{ theme: SchulcloudTheme.NIEDERSACHSEN, titles: ['incident-1'] },
			])('should filter resolved and foreign-instance incidents for $theme', async ({ theme, titles }) => {
				config.scTheme = theme;
				setup();
				const response = await request(app.getHttpServer()).get(alertPath).expect(200);

				const { data } = response.body as AlertResponse;
				expect(data.map(({ title }) => title)).toEqual(titles);
			});
		});
	});
});
