import { Injectable } from '@nestjs/common';
import { CardInitProps, ColumnInitProps } from '@shared/domain/domainobject';
import { OrganizationProps } from '@src/modules/common-cartridge';

@Injectable()
export class CommonCartridgeImportMapper {
	public mapOrganizationToColumn(organization: OrganizationProps): ColumnInitProps {
		return {
			title: organization.title,
		};
	}

	public mapOrganizationToCard(organization: OrganizationProps): CardInitProps {
		return {
			title: organization.title,
			height: 150,
		};
	}
}
