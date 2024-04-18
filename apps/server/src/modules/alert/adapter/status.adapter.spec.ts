import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '@modules/server';
import { axiosResponseFactory } from '@shared/testing';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { StatusAdapter } from './status.adapter';
import { ComponentDto, ComponentResponse, IncidentsResponse, MetaDto } from './dto';
import { createComponent, createIncident } from '../testing';

describe('StatusAdapter', () => {
	const incidentsPath = '/api/v1/incidents';
	const componentsPath = '/api/v1/components/';
	const incident = createIncident(2, 1, 0);
	const incidentDefault = createIncident(1, 1, 0);
	const incidentBrb = createIncident(2, 2, 0);
	const incidentOpen = createIncident(3, 3, 0);
	const incidentN21 = createIncident(4, 4, 0);
	const incidentThr = createIncident(5, 5, 0);
	const componentDefault = createComponent(1, 1);
	const componentBrb = createComponent(2, 2);
	const componentOpen = createComponent(3, 3);
	const componentN21 = createComponent(4, 6);
	const componentThr = createComponent(5, 7);

	let module: TestingModule;
	let adapter: StatusAdapter;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				StatusAdapter,
				{ provide: HttpService, useValue: createMock<HttpService>() },
				{ provide: ConfigService, useValue: createMock<ConfigService<ServerConfig, true>>({ get: () => 'test.url' }) },
			],
		}).compile();

		adapter = module.get(StatusAdapter);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(adapter).toBeDefined();
	});

	describe('getMessage', () => {
		describe('when no incidents', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponseFactory.build({ data: [] })));
			};
			it('should return empty data', async () => {
				setup();

				const data = await adapter.getMessage('default');

				expect(data.success).toBe(false);
				expect(data.messages.length).toBe(0);
			});
		});

		describe('when get incidents failed', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => 'error'));
			};
			it('should return empty data', async () => {
				setup();

				const data = await adapter.getMessage('default');

				expect(data.success).toBe(false);
				expect(data.messages.length).toBe(0);
			});
		});

		describe('when get components failed', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockImplementation((url) => {
					if (url.match(incidentsPath)) {
						const incidents = [incident];
						const incidentResponse = new IncidentsResponse({} as MetaDto, incidents);
						const response = axiosResponseFactory.build({ data: incidentResponse });
						return of(response);
					}

					if (url.match(componentsPath)) {
						return throwError(() => new AxiosError());
					}
					const response = axiosResponseFactory.build({ data: [] });
					return of(response);
				});
			};
			it('should set importance to ignore', async () => {
				setup();

				const data = await adapter.getMessage('default');

				expect(data.success).toBe(true);
				expect(data.messages.length).toBe(0);
			});
		});

		describe('when incidents for different instances provided', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockImplementation((url) => {
					if (url.match(incidentsPath)) {
						const incidents = [incidentDefault, incidentBrb, incidentOpen, incidentN21, incidentThr];
						const incidentResponse = new IncidentsResponse({} as MetaDto, incidents);
						const response = axiosResponseFactory.build({ data: incidentResponse });
						return of(response);
					}

					if (url.match(componentsPath)) {
						const componentId = url.at(-1);
						let component: ComponentDto;
						if (componentId === '1') {
							component = componentDefault;
						} else if (componentId === '2') {
							component = componentBrb;
						} else if (componentId === '3') {
							component = componentOpen;
						} else if (componentId === '4') {
							component = componentN21;
						} else {
							component = componentThr;
						}
						const componentResponse = new ComponentResponse(component);
						const response = axiosResponseFactory.build({ data: componentResponse });
						return of(response);
					}
					const response = axiosResponseFactory.build({ data: [] });
					return of(response);
				});
			};
			it.each(['default', 'brb', 'open', 'n21', 'thr', 'no_instance'])(
				'should return incident only for %s instance',
				async (instance) => {
					setup();

					const data = await adapter.getMessage(instance);

					expect(data.success).toBe(true);
					if (instance !== 'no_instance') {
						expect(data.messages.length).toBe(1);
					} else {
						expect(data.messages.length).toBe(0);
					}
				}
			);
		});

		describe('when many incidents provided', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockImplementation((url) => {
					if (url.match(incidentsPath)) {
						const firstIncident = createIncident(1, 0, 1);
						firstIncident.updated_at = new Date('2024-01-01 10:00:00');
						firstIncident.created_at = new Date('2024-01-01 10:00:00');
						firstIncident.name = '1';
						const secondIncident = createIncident(1, 0, 1);
						secondIncident.updated_at = new Date('2024-01-01 10:00:00');
						secondIncident.created_at = new Date('2024-01-01 10:00:00');
						secondIncident.name = '2';
						const thirdIncident = createIncident(1, 0, 2);
						thirdIncident.updated_at = new Date('2024-01-03 10:00:00');
						thirdIncident.created_at = new Date('2024-01-02 10:00:00');
						thirdIncident.name = '3';
						const fourthIncident = createIncident(1, 0, 2);
						fourthIncident.updated_at = new Date('2024-01-03 10:00:00');
						fourthIncident.created_at = new Date('2024-01-01 10:00:00');
						fourthIncident.name = '4';
						const fifthIncident = createIncident(1, 0, 2);
						fifthIncident.updated_at = new Date('2024-01-01 10:00:00');
						fifthIncident.created_at = new Date('2024-01-01 10:00:00');
						fifthIncident.name = '5';
						const incidents = [fifthIncident, fourthIncident, thirdIncident, firstIncident, secondIncident];
						const incidentResponse = new IncidentsResponse({} as MetaDto, incidents);
						const response = axiosResponseFactory.build({ data: incidentResponse });
						return of(response);
					}
					const response = axiosResponseFactory.build({ data: [] });
					return of(response);
				});
			};
			it('should return sorted incidents', async () => {
				setup();

				const data = await adapter.getMessage('default');

				expect(data.success).toBe(true);
				expect(data.messages.length).toBe(5);
				expect(data.messages[0].title).toBe('1');
				expect(data.messages[1].title).toBe('2');
				expect(data.messages[2].title).toBe('3');
				expect(data.messages[3].title).toBe('4');
				expect(data.messages[4].title).toBe('5');
			});
		});
	});
});
