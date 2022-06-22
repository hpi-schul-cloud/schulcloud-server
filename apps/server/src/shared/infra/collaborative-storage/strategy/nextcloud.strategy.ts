import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import { ITeamStorageStrategy } from './base.interface.strategy';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

interface NextcloudGroups {
	groups: string[];
}

interface NextcloudGroupfolders {
	groups: Map<string, number>;
}

interface OcsResponse<T> {
	ocs: { data: T };
}

export class NextcloudStrategy implements ITeamStorageStrategy {
	readonly baseURL: string;

	readonly httpService: HttpService;

	config: AxiosRequestConfig;

	constructor() {
		this.httpService = new HttpService();
		this.baseURL = Configuration.get('NEXTCLOUD_API_PATH') as string;
		this.config = {
			auth: {
				username: Configuration.get('NEXTCLOUD_ADMIN_USER') as string,
				password: Configuration.get('NEXTCLOUD_ADMIN_PASS') as string,
			},
			headers: { 'OCS-APIRequest': true, Accept: 'Application/json' },
		};
	}

	private static generateGroupId(dto: TeamRolePermissionsDto): string {
		return `${dto.teamName as string}-${dto.teamId as string}-${dto.roleName as string}`;
	}

	public async updateTeamPermissionsForRole(dto: TeamRolePermissionsDto) {
		const groupId = await this.findGroupId(NextcloudStrategy.generateGroupId(dto));
		const folderId = await this.findFolderIdForGroupId(groupId);
		this.setGroupPermissions(groupId, folderId, dto.permissions);
	}

	private async findGroupId(groupName: string): Promise<string> {
		return firstValueFrom(this.get(`/ocs/v1.php/cloud/groups?search=${groupName}`))
			.then((resp: AxiosResponse<OcsResponse<NextcloudGroups>>) => resp.data.ocs.data.groups[0])
			.catch((error) => {
				throw new NotFoundException(error, `Group ${groupName} not found in Nextcloud!`);
			});
	}

	private async findFolderIdForGroupId(groupId: string): Promise<string> {
		return firstValueFrom(this.get(`/apps/groupfolders/folders`))
			.then((resp: AxiosResponse<OcsResponse<Map<string, NextcloudGroupfolders>>>) => {
				const filtered = Object.entries(resp.data.ocs.data)
					.filter(([, v]) => {
						return Object.entries((v as NextcloudGroupfolders).groups).filter(([k]) => k === groupId);
					})
					.flatMap(([k]) => k);
				if (filtered.length < 1) {
					throw new NotFoundException();
				}
				return filtered[0];
			})
			.catch((error) => {
				throw new NotFoundException(error, `Group ${groupId} not found in Nextcloud!`);
			});
	}

	private setGroupPermissions(groupId: string, folderId: string, permissions: boolean[]) {
		this.post(`/apps/groupfolders/folders/${folderId}/groups/${groupId}`, {
			permissions: this.boolArrToNumber(permissions),
		});
	}

	private get(apiPath: string): Observable<AxiosResponse> {
		return this.httpService.get(`${this.baseURL}${apiPath}`, this.config);
	}

	private post(apiPath: string, data: any): Observable<AxiosResponse> {
		return this.httpService.post(`${this.baseURL}${apiPath}`, data, this.config);
	}

	private boolArrToNumber = (arr: Array<boolean>): number => parseInt(arr.map((r) => (r ? '1' : '0')).join(''), 2);
}
