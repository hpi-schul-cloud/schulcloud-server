import {Injectable} from "@nestjs/common";
import {SystemRepo} from "@shared/repo";
import {SystemMapper} from "@src/modules/system/mapper/system.mapper";
import {SystemDto} from "@src/modules/system/service/dto/system.dto";

@Injectable()
export class SystemService {
    constructor(private readonly systemRepo: SystemRepo, private readonly systemMapper: SystemMapper) {
    }

    async findOauthSystems(): Promise<SystemDto[]> {
        const oauthSystems = await this.systemRepo.findOauthSystems();
        return this.systemMapper.mapFromEntitiesToDtos(oauthSystems);
    }
}