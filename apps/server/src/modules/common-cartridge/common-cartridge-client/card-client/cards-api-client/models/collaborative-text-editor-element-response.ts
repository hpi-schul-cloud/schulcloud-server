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
import type { TimestampsResponse } from './timestamps-response';

/**
 * 
 * @export
 * @interface CollaborativeTextEditorElementResponse
 */
export interface CollaborativeTextEditorElementResponse {
    /**
     * 
     * @type {string}
     * @memberof CollaborativeTextEditorElementResponse
     */
    'id': string;
    /**
     * 
     * @type {ContentElementType}
     * @memberof CollaborativeTextEditorElementResponse
     */
    'type': ContentElementType;
    /**
     * 
     * @type {TimestampsResponse}
     * @memberof CollaborativeTextEditorElementResponse
     */
    'timestamps': TimestampsResponse;
    /**
     * 
     * @type {object}
     * @memberof CollaborativeTextEditorElementResponse
     */
    'content': object;
}



