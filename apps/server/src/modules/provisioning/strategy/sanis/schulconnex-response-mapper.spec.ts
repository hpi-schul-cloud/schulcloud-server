import { createMock } from '@golevelup/ts-jest';
import {
	SchulconnexGroupRole,
	SchulconnexGroupType,
	SchulconnexGruppenResponse,
	SchulconnexPersonenkontextResponse,
	SchulconnexResponse,
	schulconnexResponseFactory,
	SchulconnexSonstigeGruppenzugehoerigeResponse,
} from '@infra/schulconnex-client';
import { SchulconnexLizenzInfoResponse } from '@infra/schulconnex-client/response';
import { schulconnexLizenzInfoResponseFactory } from '@infra/schulconnex-client/testing/schulconnex-lizenz-info-response-factory';
import { GroupTypes } from '@modules/group';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
import { IProvisioningFeatures, ProvisioningFeatures } from '../../config';
import { ExternalGroupDto, ExternalLicenseDto, ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';

describe(SchulconnexResponseMapper.name, () => {
	let module: TestingModule;
	let mapper: SchulconnexResponseMapper;

	let provisioningFeatures: IProvisioningFeatures;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexResponseMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ProvisioningFeatures,
					useValue: {},
				},
			],
		}).compile();

		mapper = module.get(SchulconnexResponseMapper);
		provisioningFeatures = module.get(ProvisioningFeatures);
	});

	const setupSchulconnexResponse = () => {
		const externalUserId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
		const externalSchoolId = 'df66c8e6-cfac-40f7-b35b-0da5d8ee680e';

		const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
		const licenseResponse: SchulconnexLizenzInfoResponse[] = schulconnexLizenzInfoResponseFactory.build();

		return {
			externalUserId,
			externalSchoolId,
			schulconnexResponse,
			licenseResponse,
		};
	};

	describe('mapToExternalSchoolDto', () => {
		describe('when a schulconnex response is provided', () => {
			it('should map the response to an ExternalSchoolDto', () => {
				const { schulconnexResponse, externalSchoolId } = setupSchulconnexResponse();

				const result: ExternalSchoolDto = mapper.mapToExternalSchoolDto(schulconnexResponse);

				expect(result).toEqual<ExternalSchoolDto>({
					externalId: externalSchoolId,
					name: 'schoolName',
					officialSchoolNumber: 'Kennung',
					location: 'Hannover',
				});
			});
		});
	});

	describe('mapToExternalUserDto', () => {
		describe('when a schulconnex response is provided', () => {
			it('should map the response to an ExternalUserDto', () => {
				const { schulconnexResponse, externalUserId } = setupSchulconnexResponse();

				const result: ExternalUserDto = mapper.mapToExternalUserDto(schulconnexResponse);

				expect(result).toEqual<ExternalUserDto>({
					externalId: externalUserId,
					firstName: 'Hans',
					lastName: 'Peter',
					email: 'hans.peter@muster-schule.de',
					roles: [RoleName.ADMINISTRATOR],
					birthday: new Date('2023-11-17'),
				});
			});
		});
	});

	describe('mapToExternalGroupDtos', () => {
		describe('when no group is given', () => {
			const setup = () => {
				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen = undefined;

				return {
					schulconnexResponse,
				};
			};

			it('should return undefined', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toBeUndefined();
			});
		});

		describe('when unknown group type is given', () => {
			const setup = () => {
				const { schulconnexResponse } = setupSchulconnexResponse();
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				schulconnexResponse.personenkontexte[0].gruppen?.[0].gruppe.typ = 'unknown';

				return {
					schulconnexResponse,
				};
			};

			it('should not map the group', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toHaveLength(0);
			});
		});

		describe('when group type class is given', () => {
			const setup = () => {
				Object.assign<IProvisioningFeatures, Partial<IProvisioningFeatures>>(provisioningFeatures, {
					schulconnexOtherGroupusersEnabled: true,
				});

				const { schulconnexResponse } = setupSchulconnexResponse();
				const personenkontext: SchulconnexPersonenkontextResponse = schulconnexResponse.personenkontexte[0];
				const group: SchulconnexGruppenResponse = personenkontext.gruppen![0];
				const otherParticipant: SchulconnexSonstigeGruppenzugehoerigeResponse = group.sonstige_gruppenzugehoerige![0];

				return {
					schulconnexResponse,
					group,
					personenkontext,
					otherParticipant,
				};
			};

			it('should map the schulconnex response to external group dtos', () => {
				const { schulconnexResponse, group, personenkontext, otherParticipant } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result?.[0]).toEqual<ExternalGroupDto>({
					name: group.gruppe.bezeichnung,
					type: GroupTypes.CLASS,
					externalId: group.gruppe.id,
					user: {
						externalUserId: personenkontext.id,
						roleName: RoleName.TEACHER,
					},
					otherUsers: [
						{
							externalUserId: otherParticipant.ktid,
							roleName: RoleName.STUDENT,
						},
					],
				});
			});
		});

		describe('when group type other is provided', () => {
			const setup = () => {
				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.typ = SchulconnexGroupType.OTHER;

				return {
					schulconnexResponse,
				};
			};

			it('should map the group', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						type: GroupTypes.OTHER,
					}),
				]);
			});
		});

		describe('when group type course is provided', () => {
			const setup = () => {
				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.typ = SchulconnexGroupType.COURSE;

				return {
					schulconnexResponse,
				};
			};

			it('should map the group', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						type: GroupTypes.COURSE,
					}),
				]);
			});
		});

		describe('when the group role mapping for the user is missing', () => {
			const setup = () => {
				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppenzugehoerigkeit.rollen = [
					SchulconnexGroupRole.SCHOOL_SUPPORT,
				];

				return {
					schulconnexResponse,
				};
			};

			it('should not map the group', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toHaveLength(0);
			});
		});

		describe('when the user has no role in the group', () => {
			const setup = () => {
				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppenzugehoerigkeit.rollen = [];

				return {
					schulconnexResponse,
				};
			};

			it('should not map the group', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toHaveLength(0);
			});
		});

		describe('when no other participants are provided and FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED is false', () => {
			const setup = () => {
				Object.assign<IProvisioningFeatures, Partial<IProvisioningFeatures>>(provisioningFeatures, {
					schulconnexOtherGroupusersEnabled: false,
				});
				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen![0].sonstige_gruppenzugehoerige = undefined;

				return {
					schulconnexResponse,
				};
			};

			it('should set other users to undefined', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result?.[0].otherUsers).toBeUndefined();
			});
		});

		describe('when no other participants are provided and FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED is true', () => {
			const setup = () => {
				Object.assign<IProvisioningFeatures, Partial<IProvisioningFeatures>>(provisioningFeatures, {
					schulconnexOtherGroupusersEnabled: true,
				});

				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen![0].sonstige_gruppenzugehoerige = undefined;

				return {
					schulconnexResponse,
				};
			};

			it('should set other users to an emtpy array', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result?.[0].otherUsers).toStrictEqual([]);
			});
		});

		describe('when other participants have unknown roles', () => {
			const setup = () => {
				const { schulconnexResponse } = setupSchulconnexResponse();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.sonstige_gruppenzugehoerige = [
					{
						ktid: 'ktid',
						rollen: [SchulconnexGroupRole.SCHOOL_SUPPORT],
					},
				];

				return {
					schulconnexResponse,
				};
			};

			it('should not add the user to other users', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result?.[0].otherUsers).toHaveLength(0);
			});
		});
	});

	describe('mapToExternalLicenses', () => {
		describe('when a sanis response with license is provided', () => {
			it('should map the response to an ExternalLicenseDto', () => {
				const { licenseResponse } = setupSchulconnexResponse();

				const result: ExternalLicenseDto[] = SchulconnexResponseMapper.mapToExternalLicenses(licenseResponse);

				expect(result).toEqual<ExternalLicenseDto[]>([
					{
						mediumId: 'bildungscloud',
						mediaSourceId: undefined,
					},
				]);
			});
		});
	});
});
