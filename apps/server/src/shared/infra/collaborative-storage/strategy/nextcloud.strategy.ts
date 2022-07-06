import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom, Observable } from 'rxjs';
import { parseInt } from 'lodash';
import { Logger } from '@src/core/logger';
import { ICollaborativeStorageStrategy } from './base.interface.strategy';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

interface NextcloudGroups {
	groups: string[];
}

interface GroupfoldersFolder {
	folder_id: string;
}

interface OcsResponse<T> {
	ocs: { data: T };
}

interface SuccessfulRes {
	success: boolean;
}

/**
 * Nextcloud Strategy Implementation for Collaborative Storage
 *
 * @implements ICollaborativeStorageStrategy
 *
 */
@Injectable()
export class NextcloudStrategy implements ICollaborativeStorageStrategy {
	readonly baseURL: string;

	readonly httpService: HttpService;

	config: AxiosRequestConfig;

	constructor(private logger: Logger) {
		this.logger.setContext(NextcloudStrategy.name);
		this.httpService = new HttpService();
		this.baseURL = Configuration.get('NEXTCLOUD_BASE_URL') as string;
		this.config = {
			auth: {
				username: Configuration.get('NEXTCLOUD_ADMIN_USER') as string,
				password: Configuration.get('NEXTCLOUD_ADMIN_PASS') as string,
			},
			headers: { 'OCS-APIRequest': true, Accept: 'Application/json' },
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
		return firstValueFrom(this.get(`/ocs/v1.php/cloud/groups?search=${groupName}`))
			.then((resp: AxiosResponse<OcsResponse<NextcloudGroups>>) => resp.data.ocs.data.groups[0])
			.catch((error) => {
				throw new NotFoundException(error, `Group ${groupName} not found in Nextcloud!`);
			});
	}

	private async findGroupIdByTeamId(TeamId: string): Promise<string> {
		return firstValueFrom(this.get(`/ocs/v1.php/cloud/groups?search=${TeamId}`))
			.then((resp: AxiosResponse<OcsResponse<NextcloudGroups>>) => resp.data.ocs.data.groups[0])
			.catch((error) => {
				throw new NotFoundException(error, `Group with TeamId of ${TeamId} not found in Nextcloud!`);
			});
	}

	private removeGroup(groupId: string) {
		return firstValueFrom(this.delete(`/ocs/v1.php/cloud/groups/${groupId}`))
			.then((resp: AxiosResponse<OcsResponse<SuccessfulRes>>) => {
				this.logger.log(` Successfully removed group with group id: ${groupId} in Nextcloud`);
				return resp.data.ocs.data.success;
			})
			.catch((error) => {
				throw new NotFoundException(error, `Group could not be deleted in Nextcloud!`);
			});
	}

	private async findFolderIdForGroupId(groupId: string): Promise<string> {
		return firstValueFrom(this.get(`/apps/schulcloud/groupfolders/folders/group/${groupId}`))
			.then((resp: AxiosResponse<OcsResponse<GroupfoldersFolder[]>>) => resp.data.ocs.data[0].folder_id)
			.catch((error) => {
				throw new NotFoundException(error, `Folder for ${groupId} not found in Nextcloud!`);
			});
	}

	private deleteFolder(folderId: string) {
		return firstValueFrom(this.delete(`/apps/groupfolders/folders/${folderId}`))
			.then((resp: AxiosResponse<OcsResponse<SuccessfulRes>>) => {
				this.logger.log(` Successfully deleted folder with folder id: ${folderId} in Nextcloud`);
				return resp.data.ocs.data.success;
			})
			.catch((error) => {
				throw new NotFoundException(error, `Folder could not be deleted in Nextcloud!`);
			});
	}

	async deleteGroupfolderAndRemoveGroup(TeamId: string) {
		const groupId = await this.findGroupIdByTeamId(TeamId);
		const folderId = await this.findFolderIdForGroupId(groupId);
		if (groupId && folderId) {
			await this.removeGroup(groupId);
			await this.deleteFolder(folderId);
		}
	}

	private setGroupPermissions(groupId: string, folderId: string, permissions: boolean[]) {
		this.post(`/apps/groupfolders/folders/${folderId}/groups/${groupId}`, {
			permissions: this.boolArrToNumber(permissions),
		});
	}

	private get(apiPath: string): Observable<AxiosResponse> {
		return this.httpService.get(`${this.baseURL}${apiPath}`, this.config);
	}

	private post(apiPath: string, data: unknown): Observable<AxiosResponse> {
		return this.httpService.post(`${this.baseURL}${apiPath}`, data, this.config);
	}

	private delete(apiPath: string): Observable<AxiosResponse> {
		return this.httpService.delete(`${this.baseURL}${apiPath}`, this.config);
	}

	private boolArrToNumber(arr: Array<boolean>): number {
		return parseInt(arr.map((r) => (r ? '1' : '0')).join(''), 2);
	}
}
