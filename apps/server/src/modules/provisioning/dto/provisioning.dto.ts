export class ProvisioningDto {
	constructor(provisioningDto: ProvisioningDto) {
		this.externalUserId = provisioningDto.externalUserId;
	}

	externalUserId: string;
}
