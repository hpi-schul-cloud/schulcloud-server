import { createMock } from '@golevelup/ts-jest';
import {
	SchulconnexGroupRole,
	SchulconnexGroupType,
	SchulconnexGruppenResponse,
	SchulconnexPersonenkontextResponse,
	SchulconnexPoliciesInfoResponse,
	schulconnexPoliciesInfoResponseFactory,
	SchulconnexResponse,
	schulconnexResponseFactory,
	SchulconnexSonstigeGruppenzugehoerigeResponse,
} from '@infra/schulconnex-client';
import { GroupTypes } from '@modules/group';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
import { InvalidLaufzeitResponseLoggableException, InvalidLernperiodeResponseLoggableException } from '../../domain';
import { ExternalGroupDto, ExternalLicenseDto, ExternalSchoolDto, ExternalUserDto } from '../../dto';
import { ProvisioningConfig } from '../../provisioning.config';
import { SchulconnexResponseMapper } from './schulconnex-response-mapper';

describe(SchulconnexResponseMapper.name, () => {
	let module: TestingModule;
	let mapper: SchulconnexResponseMapper;

	const config: Partial<ProvisioningConfig> = {};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexResponseMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService<ProvisioningConfig, true>,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof ProvisioningConfig) => config[key]),
					},
				},
			],
		}).compile();

		mapper = module.get(SchulconnexResponseMapper);
	});

	describe('mapToExternalSchoolDto', () => {
		describe('when a schulconnex response is provided', () => {
			const setup = () => {
				const externalSchoolId = 'df66c8e6-cfac-40f7-b35b-0da5d8ee680e';

				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();

				return {
					externalSchoolId,
					schulconnexResponse,
				};
			};

			it('should map the response to an ExternalSchoolDto', () => {
				const { schulconnexResponse, externalSchoolId } = setup();

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
			const setup = () => {
				const externalUserId = 'aef1f4fd-c323-466e-962b-a84354c0e713';

				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();

				return {
					externalUserId,
					schulconnexResponse,
				};
			};

			it('should map the response to an ExternalUserDto', () => {
				const { schulconnexResponse, externalUserId } = setup();

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
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				schulconnexResponse.personenkontexte[0].gruppen![0].gruppe.typ = 'unknown' as SchulconnexGroupType;

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
				config.FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED = true;

				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();

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
					from: new Date('2024-08-01'),
					until: new Date('2025-07-31'),
				});
			});
		});

		describe('when group type other is provided', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
				config.FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED = false;
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
				config.FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED = true;

				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
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

		describe('when the group has no duration', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.laufzeit = undefined;

				return {
					schulconnexResponse,
				};
			};

			it('should map the group without a duration', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						from: undefined,
						until: undefined,
					}),
				]);
			});
		});

		describe('when the group has a duration as lernperiode', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.laufzeit = {
					vonlernperiode: '2023-2',
					bislernperiode: '2026-1',
				};

				return {
					schulconnexResponse,
				};
			};

			it('should map the group a duration', () => {
				const { schulconnexResponse } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						from: new Date('2024-02-01'),
						until: new Date('2027-01-31'),
					}),
				]);
			});
		});

		describe('when the group has a duration as an exact date', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const duration = {
					von: '2024-05-13',
					bis: '2028-07-12',
				};

				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.laufzeit = duration;

				return {
					schulconnexResponse,
					duration,
				};
			};

			it('should map the group with an exact date', () => {
				const { schulconnexResponse, duration } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						from: new Date(duration.von),
						until: new Date(duration.bis),
					}),
				]);
			});
		});

		describe('when the group has a duration as an exact date and as lernperiode', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				const duration = {
					von: '2024-05-13',
					bis: '2028-07-12',
					vonlernperiode: '2024',
					bislernperiode: '2025',
				};

				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.laufzeit = duration;

				return {
					schulconnexResponse,
					duration,
				};
			};

			it('should map the group with an exact date', () => {
				const { schulconnexResponse, duration } = setup();

				const result: ExternalGroupDto[] | undefined = mapper.mapToExternalGroupDtos(schulconnexResponse);

				expect(result).toEqual([
					expect.objectContaining<Partial<ExternalGroupDto>>({
						from: new Date(duration.von),
						until: new Date(duration.bis),
					}),
				]);
			});
		});

		describe('when the group has an invalid duration as lernperiode', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.laufzeit = {
					vonlernperiode: '2024-3',
					bislernperiode: '2021-01-02',
				};

				return {
					schulconnexResponse,
				};
			};

			it('should throw an error', () => {
				const { schulconnexResponse } = setup();

				expect(() => mapper.mapToExternalGroupDtos(schulconnexResponse)).toThrow(
					InvalidLernperiodeResponseLoggableException
				);
			});
		});

		describe('when the group has no from date', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.laufzeit = {
					bislernperiode: '2024-2',
				};

				return {
					schulconnexResponse,
				};
			};

			it('should throw an error', () => {
				const { schulconnexResponse } = setup();

				expect(() => mapper.mapToExternalGroupDtos(schulconnexResponse)).toThrow(
					InvalidLaufzeitResponseLoggableException
				);
			});
		});

		describe('when the group has no until date', () => {
			const setup = () => {
				const schulconnexResponse: SchulconnexResponse = schulconnexResponseFactory.build();
				schulconnexResponse.personenkontexte[0].gruppen![0]!.gruppe.laufzeit = {
					vonlernperiode: '2024-2',
				};

				return {
					schulconnexResponse,
				};
			};

			it('should throw an error', () => {
				const { schulconnexResponse } = setup();

				expect(() => mapper.mapToExternalGroupDtos(schulconnexResponse)).toThrow(
					InvalidLaufzeitResponseLoggableException
				);
			});
		});
	});

	describe('mapLernperiode', () => {
		describe('when the lernperiode is a full year', () => {
			it('should map the correct date', () => {
				const result = SchulconnexResponseMapper.mapLernperiode('2024');

				expect(result).toEqual({
					from: new Date('2024-08-01'),
					until: new Date('2025-07-31'),
				});
			});
		});

		describe('when the lernperiode is the first half year', () => {
			it('should map the correct date', () => {
				const result = SchulconnexResponseMapper.mapLernperiode('2024-1');

				expect(result).toEqual({
					from: new Date('2024-08-01'),
					until: new Date('2025-01-31'),
				});
			});
		});

		describe('when the lernperiode is the second half year', () => {
			it('should map the correct date', () => {
				const result = SchulconnexResponseMapper.mapLernperiode('2024-2');

				expect(result).toEqual({
					from: new Date('2025-02-01'),
					until: new Date('2025-07-31'),
				});
			});
		});

		describe('when the lernperiode is invalid', () => {
			it('should throw an error', () => {
				expect(() => SchulconnexResponseMapper.mapLernperiode('2024-3')).toThrow(
					InvalidLernperiodeResponseLoggableException
				);
			});
		});
	});

	describe('mapToExternalLicenses', () => {
		describe('when a license response has a medium id and no media source', () => {
			const setup = () => {
				const licenseResponse: SchulconnexPoliciesInfoResponse[] = schulconnexPoliciesInfoResponseFactory.buildList(1, {
					target: { uid: 'bildungscloud', partOf: '' },
				});

				return {
					licenseResponse,
				};
			};

			it('should map the response to an ExternalLicenseDto', () => {
				const { licenseResponse } = setup();

				const result: ExternalLicenseDto[] | undefined =
					SchulconnexResponseMapper.mapToExternalLicenses(licenseResponse);

				expect(result).toEqual<ExternalLicenseDto[]>([
					{
						mediumId: 'bildungscloud',
						mediaSourceId: undefined,
					},
				]);
			});
		});

		describe('when a license response has a medium id and a media source', () => {
			const setup = () => {
				const licenseResponse: SchulconnexPoliciesInfoResponse[] = schulconnexPoliciesInfoResponseFactory.buildList(1, {
					target: { uid: 'bildungscloud', partOf: 'bildungscloud-source' },
				});

				return {
					licenseResponse,
				};
			};

			it('should map the response to an ExternalLicenseDto', () => {
				const { licenseResponse } = setup();

				const result: ExternalLicenseDto[] | undefined =
					SchulconnexResponseMapper.mapToExternalLicenses(licenseResponse);

				expect(result).toEqual<ExternalLicenseDto[]>([
					{
						mediumId: 'bildungscloud',
						mediaSourceId: 'bildungscloud-source',
					},
				]);
			});
		});

		describe('when a license response has no medium id', () => {
			const setup = () => {
				const licenseResponse: SchulconnexPoliciesInfoResponse[] = schulconnexPoliciesInfoResponseFactory.buildList(1, {
					target: { uid: '', partOf: 'bildungscloud-source' },
				});

				return {
					licenseResponse,
				};
			};

			it('should should be filtered out', () => {
				const { licenseResponse } = setup();

				const result: ExternalLicenseDto[] | undefined =
					SchulconnexResponseMapper.mapToExternalLicenses(licenseResponse);

				expect(result).toEqual<ExternalLicenseDto[]>([]);
			});
		});

		describe('when a license response has no target', () => {
			const setup = () => {
				const licenseResponse: SchulconnexPoliciesInfoResponse[] = schulconnexPoliciesInfoResponseFactory.buildList(1);
				licenseResponse[0].target = undefined;

				return {
					licenseResponse,
				};
			};

			it('should should be filtered out', () => {
				const { licenseResponse } = setup();

				const result: ExternalLicenseDto[] | undefined =
					SchulconnexResponseMapper.mapToExternalLicenses(licenseResponse);

				expect(result).toEqual<ExternalLicenseDto[]>([]);
			});
		});
	});
});
