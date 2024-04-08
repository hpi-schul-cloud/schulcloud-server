import { Injectable } from '@nestjs/common';
import { AnyBoardDo, CardInitProps, ColumnInitProps } from '@shared/domain/domainobject';
import { OrganizationProps } from '@src/modules/common-cartridge';

@Injectable()
export class CommonCartridgeImportMapper {
	public mapOrganizationToColumn(organization: OrganizationProps): ColumnInitProps {
		return {
			title: organization.title,
		};
	}

	public mapOrganizationToCard(organization: OrganizationProps, children?: AnyBoardDo[]): CardInitProps {
		return {
			title: organization.title,
			height: 150,
			children,
		};
	}
}
