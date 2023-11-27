export class ProvisioningDto {
	externalUserId: string;

	constructor(provisioningDto: ProvisioningDto) {
		this.externalUserId = provisioningDto.externalUserId;
	}
}
