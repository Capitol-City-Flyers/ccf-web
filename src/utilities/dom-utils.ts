import _ from "lodash";

export function isAnchorElement(value: any): value is HTMLAnchorElement {
    return value instanceof Element
        && "tagName" in value
        && "A" === value.tagName;
}

export function isCodeElement(value: any): value is HTMLElement {
    return _.isObject(value)
        && "tagName" in value
        && "CODE" === value.tagName;
}

export function isHRElement(value: any): value is HTMLElement {
    return _.isObject(value)
        && "tagName" in value
        && "HR" === value.tagName;
}

export function isCommentNode(value: any): value is Comment {
    return _.isObject(value)
        && "nodeType" in value
        && 8 === value.nodeType;
}

export function isStrongElement(value: any): value is HTMLElement {
    return _.isObject(value)
        && "tagName" in value
        && "STRONG" === value.tagName;
}

export function isTextNode(value: any): value is Text {
    return _.isObject(value)
        && "nodeType" in value
        && 3 === value.nodeType;
}
