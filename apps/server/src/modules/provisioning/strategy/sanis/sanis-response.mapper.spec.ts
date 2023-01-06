import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { UUID } from 'bson';
import { RoleName } from '@shared/domain';

describe('SanisResponseMapper', () => {
	let mapper: SanisResponseMapper;

	const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
	const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
	const systemUUID: UUID = new UUID('bee7376a-31c3-42d3-93e3-e976f273f90d');
	const sanisResponse: SanisResponse = new SanisResponse({
		pid: userUUID.toString(),
		person: {
			name: new SanisResponseName({
				vorname: 'firstName',
				familienname: 'lastName',
			}),
			geschlecht: 'x',
			lokalisierung: 'de-de',
			vertrauensstufe: '',
		},
		personenkontexte: [
			new SanisResponsePersonenkontext({
				id: new UUID(),
				rolle: SanisRole.LERN,
				organisation: new SanisResponseOrganisation({
					id: schoolUUID,
					name: 'schoolName',
					typ: 'SCHULE',
				}),
				personenstatus: '',
				email: 'test@te.st',
			}),
		],
	});

	beforeAll(() => {
		mapper = new SanisResponseMapper();
	});

	describe('mapToSchoolDto', () => {
		it('should map a school to Dto', () => {
			const dto = mapper.mapToSchoolDto(sanisResponse, systemUUID.toString());
			expect(dto?.name).toEqual(sanisResponse.personenkontexte[0].organisation.name);
			expect(dto?.externalId).toEqual(sanisResponse.personenkontexte[0].organisation.id.toString());
			expect(dto?.systemIds[0]).toEqual(systemUUID.toString());
		});
	});

	describe('mapToUserDO', () => {
		it('should map a user to Dto', () => {
			const schoolId = 'testSchool';
			const roleId = RoleName.STUDENT;
			const userDO = mapper.mapToUserDO(sanisResponse, schoolId, roleId);
			expect(userDO.firstName).toEqual(sanisResponse.person.name.vorname);
			expect(userDO.lastName).toEqual(sanisResponse.person.name.familienname);
			expect(userDO.email).toEqual(sanisResponse.personenkontexte[0].email);
			expect(userDO.schoolId).toEqual(schoolId);
			expect(userDO.roleIds[0]).toEqual(RoleName.STUDENT);
			expect(userDO.externalId).toStrictEqual(sanisResponse.pid);
		});
	});

	describe('mapSanisRoleToRolename', () => {
		it('should map a Sanis Role to Schoolcloud Rolename', () => {
			const role = mapper.mapSanisRoleToRoleName(sanisResponse);
			expect(role).toEqual(RoleName.STUDENT);
		});
	});
});
