import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { UserUc } from '@src/modules/user/uc';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisProvisioningStrategy } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { of } from 'rxjs';
import { UUID } from 'bson';
import { UnprocessableEntityException } from '@nestjs/common';

const mapper: DeepMocked<IProviderResponseMapper<SanisResponse>> = createMock<IProviderResponseMapper<SanisResponse>>();

const schoolUc: DeepMocked<SchoolUc> = createMock<SchoolUc>();

const userUc: DeepMocked<UserUc> = createMock<UserUc>();

const httpService: DeepMocked<HttpService> = createMock<HttpService>();

const createAxiosResponse = (data: SanisResponse): AxiosResponse<SanisResponse> => ({
	data: data ?? {},
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

describe('SanisStrategy', () => {
	let sanisStrategy: SanisProvisioningStrategy;

	beforeEach(() => {
		sanisStrategy = new SanisProvisioningStrategy(mapper, schoolUc, userUc, httpService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('init', () => {
		it('should initialize the strategy', () => {
			sanisStrategy.init('testURL', {
				headers: { Authorization: `Testtoken` },
			});
		});
	});

	describe('apply', () => {
		const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
		const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
		const schoolDto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
			id: 'schoolId',
			name: 'schoolName',
			externalId: userUUID.toString(),
		});
		const userDto: ProvisioningUserOutputDto = new ProvisioningUserOutputDto({
			firstName: 'firstName',
			lastName: 'lastame',
			email: '',
			roleNames: [],
			schoolId: 'schoolId',
			externalId: schoolUUID.toString(),
		});

		const mockResponse: SanisResponse = new SanisResponse({
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
					ktid: new UUID(),
					rolle: SanisRole.LERN,
					organisation: new SanisResponseOrganisation({
						orgid: schoolUUID,
						name: 'schoolName',
						typ: 'SCHULE',
					}),
					personenstatus: '',
				}),
			],
		});
		beforeEach(() => {
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);

			sanisStrategy.init('testURL', {
				headers: { Authorization: `Testtoken` },
			});
		});

		it('should apply strategy', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(createAxiosResponse(mockResponse)));
			mapper.mapToSchoolDto.mockReturnValue(schoolDto);
			mapper.mapToUserDto.mockReturnValue(userDto);

			// Act
			const result = await sanisStrategy.apply();

			// Assert
			expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(mockResponse);
			expect(schoolUc.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(schoolDto);
			expect(mapper.mapToUserDto).toHaveBeenCalledWith(mockResponse, schoolDto.id);
			expect(userUc.saveProvisioningUserOutputDto).toHaveBeenCalled();
			expect(result.userDto).toEqual(userDto);
			expect(result.schoolDto).toEqual(schoolDto);
		});

		it('should throw error when there is no school', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(createAxiosResponse(mockResponse)));
			mapper.mapToUserDto.mockReturnValue(userDto);
			mapper.mapToSchoolDto.mockReturnValue(undefined);

			// Act
			// const result = await sanisStrategy.apply();

			// Assert
			await expect(sanisStrategy.apply()).rejects.toThrow();
			// expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(mockResponse);
			// expect(schoolUc.saveProvisioningSchoolOutputDto).not.toHaveBeenCalled();
			// expect(mapper.mapToUserDto).not.toHaveBeenCalledWith(mockResponse, schoolDto.id);
			// expect(userUc.saveProvisioningUserOutputDto).toHaveBeenCalled();
			// expect(result.userDto).toEqual(userDto);
			// expect(result.schoolDto).toEqual(undefined);
		});
	});

	describe('getType', () => {
		it('should return type SANIS', () => {
			const retType: SystemProvisioningStrategy = sanisStrategy.getType();
			expect(retType).toEqual(SystemProvisioningStrategy.SANIS);
		});
	});

	describe('getProvisioningData', () => {
		it('should throw an error when initialization fails', async () => {
			let message = '';
			try {
				await sanisStrategy.getProvisioningData();
			} catch (e) {
				if (e instanceof UnprocessableEntityException) {
					message = e.message;
				}
			}
			expect(message).toEqual('Provisioning not initialized');
		});
	});
});
