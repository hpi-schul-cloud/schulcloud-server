import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { IdTokenExtractionFailureLoggableException } from '@src/modules/oauth/loggable';
import { validate } from 'class-validator';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {
	ExternalClassDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
} from '../../dto';
import { TspProvisioningService } from '../../service/tsp-provisioning.service';
import { ProvisioningStrategy } from '../base.strategy';
import { BadDataLoggableException } from '../loggable';
import { TspJwtPayload } from './tsp.jwt.payload';

@Injectable()
export class TspProvisioningStrategy extends ProvisioningStrategy {
	RoleMapping: Record<string, RoleName> = {
		lehrer: RoleName.TEACHER,
		schueler: RoleName.STUDENT,
		admin: RoleName.ADMINISTRATOR,
	};

	constructor(private readonly provisioningService: TspProvisioningService) {
		super();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.TSP;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const decodedAccessToken: JwtPayload | null = jwt.decode(input.accessToken, { json: true });

		if (!decodedAccessToken) {
			throw new IdTokenExtractionFailureLoggableException('sub');
		}

		const payload = new TspJwtPayload(decodedAccessToken);
		const errors = await validate(payload);

		if (errors.length > 0) {
			throw new IdTokenExtractionFailureLoggableException(errors.map((error) => error.property).join(', '));
		}

		const externalUserDto = new ExternalUserDto({
			externalId: payload.sub,
			firstName: payload.personVorname,
			lastName: payload.personNachname,
			roles: (payload.ptscListRolle ?? '').split(',').map((tspRole) => this.RoleMapping[tspRole]),
		});

		const externalSchoolDto = new ExternalSchoolDto({
			externalId: payload.ptscSchuleNummer || '',
		});

		const externalClassDtoList = (payload.ptscListKlasseId ?? []).map(
			(classId: string) => new ExternalClassDto({ externalId: classId })
		);

		const oauthDataDto = new OauthDataDto({
			system: input.system,
			externalUser: externalUserDto,
			externalSchool: externalSchoolDto,
			externalClasses: externalClassDtoList,
		});

		return oauthDataDto;
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		if (!data.externalSchool) throw new BadDataLoggableException('External school is missing', { data });
		if (!data.externalClasses) throw new BadDataLoggableException('External classes are missing', { data });

		const school = await this.provisioningService.findSchoolOrFail(data.system, data.externalSchool);
		const user = await this.provisioningService.provisionUser(data, school);

		await this.provisioningService.provisionClasses(school, data.externalClasses, user);

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}
}
