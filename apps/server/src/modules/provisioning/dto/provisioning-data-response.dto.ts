export class ProvisioningDataResponseDto {
	externalUserId: string;

	officialSchoolNumber?: string;

	constructor(props: ProvisioningDataResponseDto) {
		this.externalUserId = props.externalUserId;
		this.officialSchoolNumber = props.officialSchoolNumber;
	}
}
