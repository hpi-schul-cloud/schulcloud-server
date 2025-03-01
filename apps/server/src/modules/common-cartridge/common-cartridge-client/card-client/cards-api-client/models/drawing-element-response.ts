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
import type { DrawingElementContent } from './drawing-element-content';
// May contain unused imports in some cases
// @ts-ignore
import type { TimestampsResponse } from './timestamps-response';

/**
 * 
 * @export
 * @interface DrawingElementResponse
 */
export interface DrawingElementResponse {
    /**
     * 
     * @type {string}
     * @memberof DrawingElementResponse
     */
    'id': string;
    /**
     * 
     * @type {ContentElementType}
     * @memberof DrawingElementResponse
     */
    'type': ContentElementType;
    /**
     * 
     * @type {TimestampsResponse}
     * @memberof DrawingElementResponse
     */
    'timestamps': TimestampsResponse;
    /**
     * 
     * @type {DrawingElementContent}
     * @memberof DrawingElementResponse
     */
    'content': DrawingElementContent;
}



