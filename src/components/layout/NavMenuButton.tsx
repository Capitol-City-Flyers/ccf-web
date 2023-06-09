import {PropsWithChildren, useCallback, useRef} from "react";

export default function NavMenuButton({children}: PropsWithChildren) {
    const button = useRef<HTMLButtonElement>(),
        menu = useRef<HTMLDivElement>();

    /* Toggle the menu open/closed. */
    const onButtonClick = useCallback(() => {
        const {classList: menuClassList} = menu.current!;
        button.current!.classList.toggle("open");
        menuClassList.toggle("flex");
        menuClassList.toggle("hidden");
    }, [button, menu]);
    return (
        <div className="inline-block">
            <button ref={button}
                    className="block hamburger pr-3 focus:outline-none md:hidden"
                    onClick={onButtonClick}>&nbsp;
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div className="md:hidden">
                <div ref={menu} className="absolute bg-white flex-col items-center hidden opacity-95 self-end py-3 mt-10 space-y-3 sm:w-auto sm:self-center left-12 right-12 drop-shadow-lg rounded-2xl z-20">
                    {children}
                </div>
            </div>
        </div>
    );
}
