import { IdTokenExtractionFailureLoggableException } from '@modules/oauth';
import { RoleName } from '@modules/role';
import { Injectable, NotImplementedException } from '@nestjs/common';
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
import { ProvisioningStrategy } from '../base.strategy';
import { ErwinJwtPayload } from './erwin.jwt.payload';
import { ErwinRole } from '../../../role/domain';

@Injectable()
export class ErwinProvisioningStrategy extends ProvisioningStrategy {
	constructor() {
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

	public override apply(): Promise<ProvisioningDto> {
		// TODO: EW-1404 placeholder out of scope this ticket
		throw new NotImplementedException();
	}

	// private mapRoles(erwinRole: string): RoleName | null {
	// 	const roleNameLowerCase = erwinRole.toLowerCase();

	// 	switch (roleNameLowerCase) {
	// 		case 'lehrer':
	// 			return RoleName.TEACHER;
	// 		case 'schueler':
	// 			return RoleName.STUDENT;
	// 		case 'admin':
	// 			return RoleName.ADMINISTRATOR;
	// 		default:
	// 			return null;
	// 	}
	// }

	private async parseAndValidateToken(input: OauthDataStrategyInputDto): Promise<ErwinJwtPayload> {
		const decodedAccessToken: JwtPayload | null = jwt.decode(input.accessToken, { json: true });

		if (!decodedAccessToken) {
			throw new IdTokenExtractionFailureLoggableException('sub');
		}

		const payload = new ErwinJwtPayload(decodedAccessToken);
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
			externalId: payload.personExternalId,
			erWInId: payload.sub,
			firstName: payload.personFirstName,
			lastName: payload.personLastName,
			roles: [this.mapErwinRoleToRoleName(payload.personErwinRole)],
		});

		if (!externalUserDto.roles || externalUserDto.roles.length < 1) {
			throw new IdTokenExtractionFailureLoggableException('person.role', { externalId: externalUserDto.externalId });
		}

		const externalSchoolDto: ExternalSchoolDto = new ExternalSchoolDto({
			externalId: payload.schuleExternalId,
			location: payload.schuleZugehoerigZu,
			name: payload.schuleName,
		});

		const externalClassDtoList = payload.klassen.map(
			(klasse) => new ExternalClassDto({ name: klasse.name, externalId: klasse.externalId })
		);

		return { externalUserDto, externalSchoolDto, externalClassDtoList };
	}

	private mapErwinRoleToRoleName(role: ErwinRole): RoleName {
		const mapErwinRoleToSchulcloudRoleName: Record<ErwinRole, RoleName> = {
			[ErwinRole.LERN]: RoleName.STUDENT,
			[ErwinRole.LEHR]: RoleName.TEACHER,
			[ErwinRole.LEIT]: RoleName.ADMINISTRATOR,
		};

		return mapErwinRoleToSchulcloudRoleName[role];
	}
}
