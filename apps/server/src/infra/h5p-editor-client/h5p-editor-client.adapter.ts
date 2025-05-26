import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { type H5PContentParentType, H5PCopyResponse, H5pEditorApi, PostH5PContentCopyParams } from './generated';

@Injectable()
export class H5pEditorClientAdapter {
	constructor(private readonly h5pEditorApi: H5pEditorApi) {}

	public async copyH5PContent(contentId: string, parentId: string, parentType: H5PContentParentType): Promise<string> {
		const bodyParams: PostH5PContentCopyParams = {
			parentId,
			parentType,
		};

		const response: AxiosResponse<H5PCopyResponse> = await this.h5pEditorApi.h5PEditorControllerCopyH5pContent(
			contentId,
			bodyParams
		);
		const newContentId = response.data.contentId;

		return newContentId;
	}
}
