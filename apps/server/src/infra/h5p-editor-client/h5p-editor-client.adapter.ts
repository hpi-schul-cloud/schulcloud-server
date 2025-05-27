import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import {
	Configuration,
	type H5PContentParentType,
	H5PCopyResponse,
	H5pEditorApi,
	PostH5PContentCopyParams,
} from './generated';

@Injectable()
export class H5pEditorClientAdapter {
	constructor(@Inject(REQUEST) private request: Request, private readonly configService: ConfigService) {}

	private createH5pEditorApi(): H5pEditorApi {
		const basePath = this.configService.getOrThrow<string>('H5P_EDITOR__SERVICE_BASE_URL');

		const config = new Configuration({
			accessToken: JwtExtractor.extractJwtFromRequestOrFail(this.request),
			basePath: `${basePath}/api/v3`,
		});

		const h5pEditorApi = new H5pEditorApi(config);

		return h5pEditorApi;
	}

	public async copyH5PContent(contentId: string, parentId: string, parentType: H5PContentParentType): Promise<string> {
		const h5pEditorApi = this.createH5pEditorApi();

		const bodyParams: PostH5PContentCopyParams = {
			parentId,
			parentType,
		};

		const response: AxiosResponse<H5PCopyResponse> = await h5pEditorApi.h5PEditorControllerCopyH5pContent(
			contentId,
			bodyParams
		);
		const newContentId = response.data.contentId;

		return newContentId;
	}
}
