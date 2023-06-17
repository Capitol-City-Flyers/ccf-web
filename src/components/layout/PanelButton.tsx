import {AnchorHTMLAttributes, PropsWithChildren, useCallback, useEffect, useState} from "react";
import _ from "lodash";
import {useRouter} from "next/router";
import {isAnchorElement} from "../../utilities/dom-utils";

interface PanelButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    label: string;
}

export function PanelButton({children, label}: PropsWithChildren<PanelButtonProps>) {
    const [state, setState] = useState<PanelState>("closed"),
        router = useRouter();

    const onButtonClick = useCallback(() => {
        setState(state => {
            switch (state) {
                case "open": return "closed";
                case "dismissed": return "closed";
                case "closed": return "open";
            }

        });
    }, [setState]);

    const onDocumentMouseDown = useCallback(({target}: MouseEvent) => {
        if (isAnchorElement(target)) {
            const {href} = target;
            if (_.isString(href)) {
                router.push(href).then();
            }
        }
        setState("dismissed");
    }, [setState]);

    /* When the panel is open, attach a click handler to the document which will close it. */
    const open = "open" === state;
    useEffect(() => {
        if (open) {
            document.addEventListener("mousedown", onDocumentMouseDown);
            return () => document.removeEventListener("mousedown", onDocumentMouseDown);
        }
    }, [open]);
    return (
        <div className="relative self-center">
            <a className={`${open ? "rounded-b-none" : ""} bg-blue-500 hover:bg-blue-600 ${buttonClasses}`}
               onClick={onButtonClick}>
                {label}
            </a>
            {open && (
                <div
                    className="bg-blue-50 border border-r border-t-2 border-t-blue-500 border-blue-200 rounded-box rounded-tr-none drop-shadow-xl absolute right-0 mt-1 z-30">
                    {children}
                </div>
            )}
        </div>
    );
}

type PanelState =
    | "closed"
    | "open"
    | "dismissed";

const buttonClasses = [
    "cursor-pointer",
    "py-2",
    "px-3",
    "rounded-box",
    "text-white",
    "drop-shadow-md",
    "transition-color",
].join(" ");
