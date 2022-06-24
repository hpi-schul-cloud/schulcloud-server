import { Test, TestingModule } from '@nestjs/testing';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud.strategy';
import { HttpModule } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, of } from 'rxjs';
import { NotFoundException } from '@nestjs/common';

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
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('groupfolders/folders')) {
						data = { ocs: { data: { testFolderId: { groups: { testGroupId: 0 } } } } };
					}
					if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
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
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
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
		it('should not find the group and throw a NotFoundException', async () => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					const resp: AxiosResponse = {
						data: {},
						status: 0,
						statusText: '',
						headers: {},
						config: {},
					};
					return of(resp);
				});
			await expect(
				strategy.updateTeamPermissionsForRole({
					permissions: [false, false, false, false, false],
					roleName: 'RoleName',
					teamId: 'TeamId',
					teamName: 'noName',
				})
			).rejects.toThrow(NotFoundException);
		});
		it('should not find the folder and throw a NotFoundException', async () => {
			jest
				.spyOn(strategy.httpService, 'get')
				// needed for proper mocking
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation((url: string, config?: AxiosRequestConfig): Observable<AxiosResponse> => {
					let data = {};
					if (url.endsWith('groupfolders/folders')) {
						data = { ocs: { data: {} } };
					}
					if (url.endsWith('cloud/groups?search=TeamName-TeamId-RoleName')) {
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
			await expect(
				strategy.updateTeamPermissionsForRole({
					permissions: [false, false, false, false, false],
					roleName: 'RoleName',
					teamId: 'TeamId',
					teamName: 'TeamName',
				})
			).rejects.toThrow(NotFoundException);
		});
	});
});
