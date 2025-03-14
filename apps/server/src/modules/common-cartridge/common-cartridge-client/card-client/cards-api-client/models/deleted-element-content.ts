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

/**
 * 
 * @export
 * @interface DeletedElementContent
 */
export interface DeletedElementContent {
    /**
     * 
     * @type {string}
     * @memberof DeletedElementContent
     */
    'title': string;
    /**
     * 
     * @type {ContentElementType}
     * @memberof DeletedElementContent
     */
    'deletedElementType': ContentElementType;
    /**
     * 
     * @type {string}
     * @memberof DeletedElementContent
     */
    'description': string;
}



