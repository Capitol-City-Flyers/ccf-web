import React, {createRef, PropsWithChildren, useCallback} from "react";
import {Link} from "react-router-dom";
import {BrandIconLink} from "../BrandIconLink";

export function NavMenuButton({children}: PropsWithChildren) {
    const button = createRef<HTMLButtonElement>(),
        menu = createRef<HTMLDivElement>();

    /* Toggle the menu open/closed. */
    const onButtonClick = useCallback(() => {
        const {classList: menuClassList} = menu.current!;
        button.current!.classList.toggle("open");
        menuClassList.toggle("flex");
        menuClassList.toggle("hidden");
    }, [button, menu]);
    return (
        <>
            <button ref={button}
                    className="block hamburger pr-3 focus:outline-none md:hidden "
                    onClick={onButtonClick}>
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div className="md:hidden">
                <div ref={menu} className="absolute bg-white flex-col items-center hidden opacity-95 self-end py-3 mt-10 space-y-3 sm:w-auto sm:self-center left-12 right-12 drop-shadow-lg rounded-2xl z-20">
                    {children}
                </div>
            </div>
        </>
    );
}
