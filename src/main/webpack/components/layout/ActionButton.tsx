import React, {AnchorHTMLAttributes, PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";

interface ActionButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    default?: true;
}

export function ActionButton({children, ...props}: PropsWithChildren<ActionButtonProps>) {
    const {className, ...rest} = props,
        classNames = useMemo(() => _.uniq([
            ...baselineClasses,
            ...("default" in props
                ? ["bg-blue-500", "font-medium", "hover:bg-blue-600"]
                : ["bg-blue-400", "hover:bg-blue-500"]
            ),
            ...(className?.split(/\\s*/) || [])
        ]).join(" "), [className]);
    return (
        <a className={classNames} {...rest}>
            {children}
        </a>
    );
}

const baselineClasses = freeze([
    "button",
    "cursor-pointer",
    "py-2",
    "px-3",
    "rounded-box",
    "text-white",
    "drop-shadow-md",
    "transition-color",
    "whitespace-nowrap"
]);
