import { Test, TestingModule } from '@nestjs/testing';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud.strategy';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';

describe('NextCloud Adapter Strategy', () => {
	let module: TestingModule;
	let strategy: NextcloudStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [NextcloudStrategy],
		}).compile();
		strategy = module.get(NextcloudStrategy);
	});

	describe('Update TeamPermissions For Role', () => {
		beforeAll(() => {
			jest
				.spyOn(strategy.httpService, 'get')
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('groupfolders/folders&format=json')) {
						data = { ocs: { data: { testFolderId: { groups: { testGroupId: 0 } } } } };
					}
					if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName&format=json')) {
						data = { ocs: { data: { groups: ['testGroupId'] } } };
					}
					const resp: AxiosResponse = {
						data,
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			jest
				.spyOn(strategy.httpService, 'post')
				.mockImplementation((url: string, data: any, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					return of({
						data: [],
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					});
				});
		});
		it('should call the setGroupPermissions method', async () => {
			await strategy.updateTeamPermissionsForRole({
				permissions: [false, false, false, false, false],
				roleName: 'RoleName',
				teamId: 'TeamId',
				teamName: 'TeamName',
			});
			expect(strategy.httpService.get).toBeCalledTimes(2);
			expect(strategy.httpService.post).toBeCalledTimes(1);
		});
	});
});
