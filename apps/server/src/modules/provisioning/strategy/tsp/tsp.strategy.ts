import { IdTokenExtractionFailureLoggableException } from '@modules/oauth/loggable';
import { RoleName } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
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

	public getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.TSP;
	}

	public override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const payload = await this.parseAndValidateToken(input);
		const { externalUserDto, externalSchoolDto, externalClassDtoList } = this.extractDataFromPayload(payload);

		const oauthDataDto = new OauthDataDto({
			system: input.system,
			externalUser: externalUserDto,
			externalSchool: externalSchoolDto,
			externalClasses: externalClassDtoList,
		});

		return oauthDataDto;
	}

	public override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
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

	private async parseAndValidateToken(input: OauthDataStrategyInputDto): Promise<TspJwtPayload> {
		const decodedAccessToken: JwtPayload | null = jwt.decode(input.accessToken, { json: true });

		if (!decodedAccessToken) {
			throw new IdTokenExtractionFailureLoggableException('sub');
		}

		const payload = new TspJwtPayload(decodedAccessToken);
		const errors = await validate(payload);

		if (errors.length > 0) {
			throw new IdTokenExtractionFailureLoggableException(
				errors.map((error) => error.property),
				{ externalId: payload.sub }
			);
		}

		return payload;
	}

	private extractDataFromPayload(payload: TspJwtPayload): {
		externalUserDto: ExternalUserDto;
		externalSchoolDto: ExternalSchoolDto;
		externalClassDtoList: ExternalClassDto[];
	} {
		const externalUserDto = new ExternalUserDto({
			externalId: payload.sub,
			firstName: payload.personVorname,
			lastName: payload.personNachname,
			roles: payload.ptscListRolle
				.split(',')
				.map((role) => this.mapRoles(role))
				.filter(Boolean) as RoleName[],
		});

		if (externalUserDto.roles.length < 1) {
			throw new IdTokenExtractionFailureLoggableException('ptscListRolle', { externalId: externalUserDto.externalId });
		}

		const externalSchoolDto = new ExternalSchoolDto({
			externalId: payload.ptscSchuleNummer,
		});

		const externalClassDtoList = payload.ptscListKlasseId
			? payload.ptscListKlasseId.split(',').map((externalId) => new ExternalClassDto({ externalId }))
			: [];

		return { externalUserDto, externalSchoolDto, externalClassDtoList };
	}
}
