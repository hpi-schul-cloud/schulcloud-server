import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { GroupTypes } from '@src/modules/group';
import { UUID } from 'bson';
import { ExternalGroupDto, ExternalSchoolDto, ExternalUserDto } from '../../dto';
import {
	SanisGroupRole,
	SanisGroupType,
	SanisGruppenResponse,
	SanisPersonenkontextResponse,
	SanisResponse,
	SanisRole,
} from './response';
import { SanisResponseMapper } from './sanis-response.mapper';

describe('SanisResponseMapper', () => {
	let module: TestingModule;
	let mapper: SanisResponseMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SanisResponseMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		mapper = module.get(SanisResponseMapper);
	});

	const setupSanisResponse = () => {
		const externalUserId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
		const externalSchoolId = 'df66c8e6-cfac-40f7-b35b-0da5d8ee680e';
		const sanisResponse: SanisResponse = {
			pid: externalUserId,
			person: {
				name: {
					vorname: 'firstName',
					familienname: 'lastName',
				},
				geschlecht: 'x',
				lokalisierung: 'de-de',
				vertrauensstufe: '',
			},
			personenkontexte: [
				{
					id: new UUID().toString(),
					rolle: SanisRole.LERN,
					organisation: {
						id: new UUID(externalSchoolId).toString(),
						name: 'schoolName',
						typ: 'SCHULE',
						kennung: 'NI_123456_NI_ashd3838',
					},
					personenstatus: '',
					gruppen: [
						{
							gruppe: {
								id: new UUID().toString(),
								bezeichnung: 'bezeichnung',
								typ: SanisGroupType.CLASS,
								laufzeit: {
									von: new Date(2023, 1, 8),
									bis: new Date(2024, 7, 31),
								},
								orgid: 'orgid',
							},
							gruppenzugehoerigkeit: {
								rollen: [SanisGroupRole.TEACHER],
							},
							sonstige_gruppenzugehoerige: [
								{
									rollen: [SanisGroupRole.STUDENT],
									ktid: 'ktid',
								},
							],
						},
					],
				},
			],
		};

		return {
			externalUserId,
			externalSchoolId,
			sanisResponse,
		};
	};

	describe('mapToExternalSchoolDto', () => {
		describe('when a sanis response is provided', () => {
			it('should map the response to an ExternalSchoolDto', () => {
				const { sanisResponse, externalSchoolId } = setupSanisResponse();

				const result: ExternalSchoolDto = mapper.mapToExternalSchoolDto(sanisResponse);

				expect(result).toEqual<ExternalSchoolDto>({
					externalId: externalSchoolId,
					name: 'schoolName',
					officialSchoolNumber: '123456_NI_ashd3838',
				});
			});
		});
	});

	describe('mapToExternalUserDto', () => {
		describe('when a sanis response is provided', () => {
			it('should map the response to an ExternalUserDto', () => {
				const { sanisResponse, externalUserId } = setupSanisResponse();

				const result: ExternalUserDto = mapper.mapToExternalUserDto(sanisResponse);

				expect(result).toEqual<ExternalUserDto>({
					externalId: externalUserId,
					firstName: 'firstName',
					lastName: 'lastName',
					roles: [RoleName.STUDENT],
				});
			});
		});
	});

	describe('mapToExternalGroupDtos', () => {
		describe('when no group is given', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen = undefined;

				return {
					sanisResponse,
				};
			};

			it('should return undefined', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toBeUndefined();
			});
		});

		describe('when group type is given', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				const personenkontext: SanisPersonenkontextResponse = sanisResponse.personenkontexte[0];
				const group: SanisGruppenResponse = personenkontext.gruppen![0];

				return {
					sanisResponse,
					group,
					personenkontext,
				};
			};

			it('should map the sanis response to external group dtos', () => {
				const { sanisResponse, group, personenkontext } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result![0]).toEqual<ExternalGroupDto>({
					name: group.gruppe.bezeichnung,
					type: GroupTypes.CLASS,
					externalOrganizationId: group.gruppe.orgid,
					from: group.gruppe.laufzeit.von,
					until: group.gruppe.laufzeit.bis,
					externalId: group.gruppe.id,
					users: [
						{
							externalUserId: group.sonstige_gruppenzugehoerige[0].ktid,
							roleName: RoleName.STUDENT,
						},
						{
							externalUserId: personenkontext.id,
							roleName: RoleName.TEACHER,
						},
					],
				});
			});
		});

		describe('when no group type is provided', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0]!.gruppe.typ = SanisGroupType.OTHER;

				return {
					sanisResponse,
				};
			};

			it('should return empty array', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result).toHaveLength(0);
			});
		});

		describe('when a group role mapping is missing', () => {
			const setup = () => {
				const { sanisResponse } = setupSanisResponse();
				sanisResponse.personenkontexte[0].gruppen![0]!.sonstige_gruppenzugehoerige[0].rollen = [
					SanisGroupRole.SCHOOL_SUPPORT,
				];

				return {
					sanisResponse,
				};
			};

			it('should return only users with known roles', () => {
				const { sanisResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(sanisResponse);

				expect(result![0].users).toHaveLength(1);
			});
		});
	});
});
