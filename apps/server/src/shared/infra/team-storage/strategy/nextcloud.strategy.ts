import { HttpService } from '@nestjs/axios';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';
import { IFileStorageStrategy } from './base.interface.strategy';
import { NotFoundException } from "@nestjs/common";
import {Configuration} from "@hpi-schul-cloud/commons/lib";
import {integer} from "aws-sdk/clients/backup";
import {AxiosRequestConfig, AxiosResponse} from "axios";
import {firstValueFrom, Observable} from "rxjs";

export class NextcloudStrategy implements IFileStorageStrategy {
    baseURL: string;
    config: AxiosRequestConfig;

    constructor(private readonly httpService: HttpService) {
        this.baseURL = Configuration.get("NEXTCLOUD_API_PATH");
        this.config = {
            auth: {
                username: Configuration.get("NEXTCLOUD_ADMIN_USER") as string,
                password: Configuration.get("NEXTCLOUD_ADMIN_PASS") as string
            },
            headers: {"OCS-APIRequest": true}
        };
    }

    public async updateTeamPermissionsForRole(dto: TeamRolePermissionsDto) {
        const groupId = await this.findGroupId(`${dto.teamName}-${dto.teamId}-${dto.roleName}`);
        const folderId = await this.findFolderIdForGroupId(groupId);
        await this.setGroupPermissions(groupId, folderId, dto.permissions);
    }

    private async findGroupId(groupName: string): Promise<string> {
        return await firstValueFrom(this.get(`/ocs/v1.php/cloud/groups?search=${groupName}&format=json`))
            .then((resp) => (resp.data.groups[0] as string))
            .catch((error) => {
                throw new NotFoundException(error, `Group ${groupName} not found in Nextcloud!`)
            });
    }

    private async findFolderIdForGroupId(groupId: string): Promise<string> {
        return await firstValueFrom(this.get(`/apps/groupfolders/folders&format=json`))
            .then((resp) =>{
                const filtered = resp.data.folderMap.values.filter((folder) => folder.groups.contains(groupId));
                if (filtered.length<1) {throw new NotFoundException()}
                return filtered[0].id as string;
            })
            .catch((error) => {
                throw new NotFoundException(error, `Group ${groupId} not found in Nextcloud!`)
            });
    }

    private async setGroupPermissions(groupId: string, folderId: string, permissions: boolean[]) {
        await this.post(
            `/apps/groupfolders/folders/${folderId}/groups/${groupId}`,
            {"permissions": this.boolArrToNumber(permissions)});
    }

    private get(apiPath: string): Observable<AxiosResponse> {
        return this.httpService.get(`${this.baseURL}${apiPath}`, this.config);
    }

    private post(apiPath: string, data: any): Observable<AxiosResponse> {
        return this.httpService.post(`${this.baseURL}${apiPath}`, data, this.config);
    }

    private boolArrToNumber = (arr: Array<boolean>): number =>
        parseInt(arr.map(r => r ? '1' : '0').join(''), 2);
}
