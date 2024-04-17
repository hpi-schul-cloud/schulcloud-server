import { INestApplication } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { of } from 'rxjs';
import { axiosResponseFactory } from '@shared/testing';
import { serverConfig, ServerTestModule } from '../../../server';
import { createComponent, createIncident } from '../../testing';
import { AlertResponse } from '../dto';
import { ComponentDto, ComponentResponse, IncidentsResponse, MetaDto } from '../../adapter/dto';
import { SchulcloudTheme } from '../../../server/types/schulcloud-theme.enum';

describe('Alert Controller api', () => {
	const alertPath = '/alert';
	const incidentsPath = '/api/v1/incidents';
	const componentsPath = '/api/v1/components/';
	const incident1 = createIncident(1, 0, 2);
	const incident2 = createIncident(2, 1, 4);
	const incident3 = createIncident(3, 2, 0);
	const component1 = createComponent(0, 1);
	const component2 = createComponent(1, 2);
	const component3 = createComponent(2, 3);

	let app: INestApplication;
	let httpService: DeepMocked<HttpService>;

	beforeEach(async () => {
		const config = serverConfig();
		config.ALERT_STATUS_URL = 'test';
		config.SC_THEME = SchulcloudTheme.DEFAULT;

		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(HttpService)
			.useValue(createMock<HttpService>())
			.compile();
		app = module.createNestApplication();
		await app.init();
		httpService = module.get(HttpService);
		jest.useFakeTimers();
	});

	afterAll(async () => {
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
					if (url === incidentsPath) {
						const incidents = [incident1, incident2, incident3];
						const incidentResponse = new IncidentsResponse({} as MetaDto, incidents);
						const response = axiosResponseFactory.build({ data: incidentResponse });
						return of(response);
					}

					if (url.startsWith(componentsPath)) {
						const componentId = url.at(-1);
						let component: ComponentDto;
						if (componentId === '0') {
							component = component1;
						} else if (componentId === '1') {
							component = component2;
						} else {
							component = component3;
						}
						const componentResponse = new ComponentResponse(component);
						const response = axiosResponseFactory.build({ data: componentResponse });
						return of(response);
					}
					const response = axiosResponseFactory.build({ data: [] });
					return of(response);
				});
			};

			it('should return filtered alert list by status and instance', async () => {
				setup();
				const response = await request(app.getHttpServer()).get(alertPath).expect(200);

				const { data } = response.body as AlertResponse;
				expect(data.length).toBe(2);
			});
		});
	});
});
