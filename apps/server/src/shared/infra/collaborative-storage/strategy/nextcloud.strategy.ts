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

export class NextcloudStrategy implements ITeamStorageStrategy {
	baseURL: string;

	config: AxiosRequestConfig;

	constructor(private readonly httpService: HttpService) {
		this.baseURL = Configuration.get('NEXTCLOUD_API_PATH') as string;
		this.config = {
			auth: {
				username: Configuration.get('NEXTCLOUD_ADMIN_USER') as string,
				password: Configuration.get('NEXTCLOUD_ADMIN_PASS') as string,
			},
			headers: { 'OCS-APIRequest': true },
		};
	}

	public async updateTeamPermissionsForRole(dto: TeamRolePermissionsDto) {
		const groupId = await this.findGroupId(NextcloudStrategy.generateGroupId(dto));
		const folderId = await this.findFolderIdForGroupId(groupId);
		this.setGroupPermissions(groupId, folderId, dto.permissions);
	}

	private static generateGroupId(dto: TeamRolePermissionsDto): string {
		return `${dto.teamName as string}-${dto.teamId as string}-${dto.roleName as string}`;
	}

	private async findGroupId(groupName: string): Promise<string> {
		return firstValueFrom(this.get(`/ocs/v1.php/cloud/groups?search=${groupName}&format=json`))
			.then((resp: AxiosResponse<NextcloudGroups>) => resp.data.groups[0])
			.catch((error) => {
				throw new NotFoundException(error, `Group ${groupName} not found in Nextcloud!`);
			});
	}

	private async findFolderIdForGroupId(groupId: string): Promise<string> {
		return firstValueFrom(this.get(`/apps/groupfolders/folders&format=json`))
			.then((resp: AxiosResponse<Map<string, NextcloudGroupfolders>>) => {
				const filtered = Array.from(resp.data.values())
					.filter((folder: NextcloudGroupfolders) => folder.groups.has(groupId))
					.flatMap((folder) => Array.from(folder.groups.keys()));
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
