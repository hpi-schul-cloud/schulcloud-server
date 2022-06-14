import { RoleDto } from '@src/modules/team-storage/services/dto/Role.dto';
import { TeamPermissionsDto } from '@src/modules/team-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/team-storage/services/dto/team.dto';
import {IFileStorageStrategy} from "@shared/infra/team-storage/strategy/base.interface.strategy";
import {Injectable} from "@nestjs/common";
import {TeamStorageAdapterMapper} from "@shared/infra/team-storage/mapper/team-storage-adapter.mapper";

@Injectable()
export class TeamStorageAdapter {
    constructor(private strategy: IFileStorageStrategy, private mapper: TeamStorageAdapterMapper) {};

	updateTeamPermissionsForRole(team: TeamDto, role: RoleDto, permissions: TeamPermissionsDto) {
        this.strategy.updateTeamPermissionsForRole(this.mapper.mapDomainToAdapter(team, role, permissions))
    }
}
