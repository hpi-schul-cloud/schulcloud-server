import { Injectable } from '@nestjs/common';
// eslint-disable-next-line import/extensions
import EtherPadClient from '../../../../../src/services/etherpad/utils/EtherpadClient.js';
import { CreateCollaborativeTextEditorBodyParams } from './controller/dto/create-collaborative-text-editor.body.params.js';

@Injectable()
export class CollaborativeTextEditorAdapter {
	async createCollaborativeTextEditor(userId: string, params: CreateCollaborativeTextEditorBodyParams): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const groupResponse = await EtherPadClient.createOrGetGroup({ groupMapper: params.parentId });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		console.log(groupResponse);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const response = await EtherPadClient.createOrGetGroupPad({
			padName: 'padName',
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			groupID: groupResponse.data.groupID,
		});

		console.log(response);
	}
}
