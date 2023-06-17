import {AnchorHTMLAttributes, PropsWithChildren, useCallback, useEffect, useRef, useState} from "react";
import _ from "lodash";
import {useRouter} from "next/router";
import {isAnchorElement} from "../../utilities/dom-utils";
import {freeze} from "immer";

interface PanelButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    label: string;
}

export function PanelButton({children, label}: PropsWithChildren<PanelButtonProps>) {
    const [open, setOpen] = useState(false),
        buttonRef = useRef<HTMLAnchorElement>(),
        panelRef = useRef<HTMLDivElement>(),
        router = useRouter();

    /* Close the panel on click anywhere outside the panel; toggle on click in the show/hide button. */
    const onDocumentClick = useCallback(({target}: MouseEvent) => {
        if (target === buttonRef.current) {
            setOpen(open => !open);
        } else if (false === panelRef.current?.contains(target as Element)) {
            setOpen(false);
        }
    }, [setOpen]);

    /* Close the panel when the user navigates away. */
    const {pathname} = router;
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    /* Attach document event handler(s) to close the panel when necessary. */
    useEffect(() => {
        document.addEventListener("click", onDocumentClick);
        return () => {
            document.removeEventListener("click", onDocumentClick);
        }
    }, []);
    return (
        <div className="relative self-center">
            <a ref={buttonRef} className={open ? openButtonClasses : baseButtonClasses}>{label}</a>
            {open && (
                <div ref={panelRef} className={panelClasses}>
                    {children}
                </div>
            )}
        </div>
    );
}

const baseButtonClasses = [
    "bg-blue-500",
    "cursor-pointer",
    "drop-shadow-md",
    "py-2",
    "px-3",
    "rounded-box",
    "select-none",
    "text-white",
    "transition-color",
    "hover:bg-blue-600",
].join(" ");

const openButtonClasses = `${baseButtonClasses} rounded-b-none`;

const panelClasses = [
    "absolute",
    "bg-blue-50",
    "border",
    "border-blue-200",
    "border-r",
    "border-t-2",
    "border-t-blue-500",
    "drop-shadow-xl",
    "mt-1",
    "right-0",
    "rounded-box",
    "rounded-tr-none",
    "z-30"
].join(" ");