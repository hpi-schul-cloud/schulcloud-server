/* tslint:disable */
/* eslint-disable */
/**
 * Schulcloud-Verbund-Software Server API
 * This is v3 of Schulcloud-Verbund-Software Server. Checkout /docs for v1.
 *
 * The version of the OpenAPI document: 3.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import type { ContentElementType } from './content-element-type';
// May contain unused imports in some cases
// @ts-ignore
import type { H5pElementContent } from './h5p-element-content';
// May contain unused imports in some cases
// @ts-ignore
import type { TimestampsResponse } from './timestamps-response';

/**
 *
 * @export
 * @interface H5pElementResponse
 */
export interface H5pElementResponse {
	/**
	 *
	 * @type {string}
	 * @memberof H5pElementResponse
	 */
	id: string;
	/**
	 *
	 * @type {ContentElementType}
	 * @memberof H5pElementResponse
	 */
	type: ContentElementType;
	/**
	 *
	 * @type {H5pElementContent}
	 * @memberof H5pElementResponse
	 */
	content: H5pElementContent;
	/**
	 *
	 * @type {TimestampsResponse}
	 * @memberof H5pElementResponse
	 */
	timestamps: TimestampsResponse;
}
