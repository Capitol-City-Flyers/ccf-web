import React, {
    AnchorHTMLAttributes,
    ComponentType,
    PropsWithChildren,
    ReactNode,
    useCallback,
    useMemo,
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
        }, [panel, panelOpen]);
    const onButtonClick = useCallback(() => {
        setPanelOpen(open => !open);
    }, [setPanelOpen]);
    return (
        <div className="relative self-center">
            <ActionButton className={panelOpen ? "bg-blue-500 rounded-b-none" : ""} onClick={onButtonClick}>{label}</ActionButton>
            {panelOpen && (
                <div
                    className="bg-blue-50 border border-r border-t-2 border-t-blue-500 border-blue-200 rounded-box rounded-tr-none drop-shadow-xl absolute right-0 mt-1 z-30">
                    {panelElement}
                </div>
            )}
        </div>
    );
}
