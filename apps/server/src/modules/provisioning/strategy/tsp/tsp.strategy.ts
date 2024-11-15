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
import { BadDataLoggableException } from '../../loggable';
import { TspProvisioningService } from '../../service/tsp-provisioning.service';
import { ProvisioningStrategy } from '../base.strategy';
import { TspJwtPayload } from './tsp.jwt.payload';

@Injectable()
export class TspProvisioningStrategy extends ProvisioningStrategy {
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
			roles: payload.ptscListRolle
				.split(',')
				.map((role) => this.mapRoles(role))
				.filter(Boolean) as RoleName[],
		});

		if (externalUserDto.roles && externalUserDto.roles.length < 1) {
			throw new IdTokenExtractionFailureLoggableException('ptscListRolle');
		}

		const externalSchoolDto = new ExternalSchoolDto({
			externalId: payload.ptscSchuleNummer,
		});

		const externalClassDtoList = payload.ptscListKlasseId
			.split(',')
			.map((externalId) => new ExternalClassDto({ externalId }));

		const oauthDataDto = new OauthDataDto({
			system: input.system,
			externalUser: externalUserDto,
			externalSchool: externalSchoolDto,
			externalClasses: externalClassDtoList,
		});

		return oauthDataDto;
	}

	override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		if (!data.externalSchool) {
			throw new BadDataLoggableException('External school is missing for user', {
				externalId: data.externalUser.externalId,
			});
		}
		if (!data.externalClasses) {
			throw new BadDataLoggableException('External classes are missing for user', {
				externalId: data.externalUser.externalId,
			});
		}

		const school = await this.provisioningService.findSchoolOrFail(data.system, data.externalSchool);
		const user = await this.provisioningService.provisionUser(data, school);

		await this.provisioningService.provisionClasses(school, data.externalClasses, user);

		return new ProvisioningDto({ externalUserId: user.externalId || data.externalUser.externalId });
	}

	private mapRoles(tspRole: string): RoleName | null {
		const roleNameLowerCase = tspRole.toLowerCase();

		switch (roleNameLowerCase) {
			case 'lehrer':
				return RoleName.TEACHER;
			case 'schueler':
				return RoleName.STUDENT;
			case 'admin':
				return RoleName.ADMINISTRATOR;
			default:
				return null;
		}
	}
}
