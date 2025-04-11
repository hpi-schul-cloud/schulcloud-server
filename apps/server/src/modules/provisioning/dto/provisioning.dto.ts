export class ProvisioningDto {
	public externalUserId: string;

	constructor(provisioningDto: ProvisioningDto) {
		this.externalUserId = provisioningDto.externalUserId;
	}
}
