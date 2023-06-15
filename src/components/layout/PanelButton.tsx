import React, {
    AnchorHTMLAttributes,
    ComponentType,
    PropsWithChildren,
    ReactNode,
    useCallback, useLayoutEffect,
    useMemo, useRef,
    useState
} from "react";
import ActionButton from "./ActionButton";
import _ from "lodash";

interface PanelButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    label: string;
    panel: ReactNode | ComponentType;
}

export function PanelButton({label, panel}: PropsWithChildren<PanelButtonProps>) {
    const [panelOpen, setPanelOpen] = useState(() => false),
        panelElement = useMemo<null | ReactNode>(() => {
            if (!panelOpen) {
                return null;
            } else if ("function" === typeof panel) {
                const Panel = panel;
                return (<Panel/>);
            }
            return panel as ReactNode;
        }, [panel, panelOpen]),
        containerRef = useRef<HTMLDivElement>();

    const onDocumentMouseDown = useCallback((ev: MouseEvent) => {
        setPanelOpen(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPanelOpen(open => !open);
    }, [setPanelOpen]);

    useLayoutEffect(() => {
        if (panelOpen) {
            document.addEventListener("mousedown", onDocumentMouseDown);
            return () => document.removeEventListener("mousedown", onDocumentMouseDown);
        }
    }, [panelOpen]);

    return (
        <div className="relative self-center">
            <ActionButton className={panelOpen ? "bg-blue-500 rounded-b-none" : ""}
                          onClick={onButtonClick}>{label}</ActionButton>
            {panelOpen && (
                <div ref={containerRef}
                     className="bg-blue-50 border border-r border-t-2 border-t-blue-500 border-blue-200 rounded-box rounded-tr-none drop-shadow-xl absolute right-0 mt-1 z-30">
                    {panelElement}
                </div>
            )}
        </div>
    );
}
