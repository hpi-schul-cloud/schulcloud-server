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
import { ErwinProvisioningService, ProvisioningEntityType } from '../../service/erwin-provisioning.service';
import { ProvisioningStrategy } from '../base.strategy';
import { ErwinRole, MappedSvsRolle, PayloadRolle } from './enums/rolle.enum';
import { ErwinJwtPayload } from './erwin.jwt.payload';
import util from 'util';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ErwinProvisioningStrategy extends ProvisioningStrategy {
	constructor(private readonly erwinProvisioningService: ErwinProvisioningService) {
		super();
	}

	public getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ERWIN;
	}

	public override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const payload = await this.parseAndValidateToken(input);
		const { externalUserDto, externalSchoolDto, externalClassDtoList } = this.extractDataFromPayload(payload);

		return new OauthDataDto({
			system: input.system,
			externalUser: externalUserDto,
			externalSchool: externalSchoolDto,
			externalClasses: externalClassDtoList,
		});
	}

	public override async apply(data: OauthDataDto): Promise<ProvisioningDto> {
		if (!data.externalSchool) {
			throw new BadDataLoggableException('External school is missing', {
				externalId: data.externalUser.externalId,
			});
		}

		await this.erwinProvisioningService.provisionEntity(ProvisioningEntityType.SCHOOL, {
			system: data.system,
			externalSchool: data.externalSchool,
		});

		await this.erwinProvisioningService.provisionEntity(ProvisioningEntityType.USER, {
			system: data.system,
			externalSchool: data.externalSchool,
			externalUser: data.externalUser,
		});

		for (const externalClass of data.externalClasses ?? []) {
			await this.erwinProvisioningService.provisionEntity(ProvisioningEntityType.CLASS, {
				system: data.system,
				externalSchool: data.externalSchool,
				externalClass,
			});
		}

		return new ProvisioningDto({
			externalUserId: data.externalUser.externalId,
		});
	}

	private async parseAndValidateToken(input: OauthDataStrategyInputDto): Promise<ErwinJwtPayload> {
		const decodedAccessToken: JwtPayload | null = jwt.decode(input.accessToken, { json: true });

		if (!decodedAccessToken) {
			throw new IdTokenExtractionFailureLoggableException('sub');
		}

		const payload = plainToInstance(ErwinJwtPayload, decodedAccessToken);
		if (payload.person.email === '') {
			payload.person.email = `${payload.person.erwinId}@erwin.portal`;
		}

		const errors = await validate(payload);
		if (errors.length > 0) {
			throw new IdTokenExtractionFailureLoggableException(
				errors.map((error) => error.property),
				{ externalId: payload.sub }
			);
		}

		return payload;
	}

	private extractDataFromPayload(payload: ErwinJwtPayload): {
		externalUserDto: ExternalUserDto;
		externalSchoolDto: ExternalSchoolDto;
		externalClassDtoList: ExternalClassDto[];
	} {
		const externalUserDto: ExternalUserDto = new ExternalUserDto({
			externalId: payload.person.externalId,
			erwinId: payload.sub,
			firstName: payload.person.firstName,
			lastName: payload.person.lastName,
			roles: [this.mapPayloadRoleToRoleName(payload.person.role)],
		});

		if (!externalUserDto.erwinId) {
			throw new IdTokenExtractionFailureLoggableException('person.sub', { erwinId: externalUserDto.erwinId });
		}

		const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
			externalId: payload.schule.externalId,
			erwinId: payload.schule.erwinId,
			name: payload.schule.name,
		});

		let externalClassDtoList: ExternalClassDto[] = [];
		if (payload.klassen) {
			externalClassDtoList = payload.klassen.map(
				(klasse) =>
					new ExternalClassDto({
						name: klasse.name,
						externalId: klasse.externalId,
						erwinId: klasse.erwinId,
					})
			);
		}

		return { externalUserDto, externalSchoolDto, externalClassDtoList };
	}

	private mapPayloadRoleToRoleName(role: PayloadRolle): RoleName {
		const erwinRoleMap: Record<ErwinRole, RoleName> = {
			[ErwinRole.LERN]: RoleName.STUDENT,
			[ErwinRole.LEHR]: RoleName.TEACHER,
			[ErwinRole.LEIT]: RoleName.ADMINISTRATOR,
		};
		const mappedSvsRolleMap: Record<MappedSvsRolle, RoleName> = {
			[MappedSvsRolle.USER]: RoleName.USER,
			[MappedSvsRolle.STUDENT]: RoleName.STUDENT,
			[MappedSvsRolle.TEACHER]: RoleName.TEACHER,
			[MappedSvsRolle.SUPERHERO]: RoleName.SUPERHERO,
			[MappedSvsRolle.ADMIN]: RoleName.ADMINISTRATOR,
		};

		if (Object.values(ErwinRole).includes(role as ErwinRole)) {
			return erwinRoleMap[role as ErwinRole];
		}

		return mappedSvsRolleMap[role as MappedSvsRolle];
	}
}
