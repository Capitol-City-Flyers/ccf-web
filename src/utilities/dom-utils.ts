import _ from "lodash";

export function isAnchorElement(value: any): value is HTMLAnchorElement {
    return value instanceof Element
        && "tagName" in value
        && "A" === value.tagName;
}