import { get } from 'lodash';

const TEMPLATE_REGEXP = /{{2}(.+?)}{2}/g;

/**
 * Inserts data into the content.
 *
 * @param {String} content
 * @param {Object} data
 *
 * @return {String}
 */
export default function template(content, data) {
    let result;

    while ((result = TEMPLATE_REGEXP.exec(content)) !== null) {
        const item = result[1].trim();
        if (item) {
            const value = get(data, item);
            if (value !== undefined && value !== null) {
                content = content.replace(result[0], value);
            }
        }
    }

    return content;
}
