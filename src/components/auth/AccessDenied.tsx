import {useCallback} from "react";
import {useMessages} from "../../providers/messages/MessagesContext";
import type {Role} from "../../providers/app/app-types";

/**
 * Properties for an [AccessDenied] component.
 */
interface AccessDeniedBaseProps {
    required: Array<Role>;
}

/**
 * Properties for an [AccessDenied] component *if* the user should be given the option to retry.
 */
interface AccessDeniedRetryProps {

    /**
     * Flag indicating whether an "allow retry" button should be displayed.
     */
    allowRetry: true;

    /**
     * Callback to invoke if the user clicks the "retry" button.
     */
    onRetry();
}

type AccessDeniedProps =
    & AccessDeniedBaseProps
    & (AccessDeniedRetryProps | never);

/**
 * [AccessDenied] presents an "access denied" message, optionally accompanied by a "retry" button allowing
 * authentication to be attempted again.
 *
 * @param props the component properties.
 * @constructor
 */
export default function AccessDenied(props: AccessDeniedProps) {
    const messages = useMessages({
            accessDenied: "cin.title.access-denied",
            retry: "cin.title.retry"
        }),
        allowRetry = isAccessDeniedRetryProps(props),
        onRetry = allowRetry && props.onRetry;
    const onRetryClick = useCallback(() => {
        onRetry && onRetry();
    }, [onRetry]);
    return (
        <div>
            <h2>{messages.accessDenied}</h2>
            {allowRetry && (<button onClick={onRetryClick}>{messages.retry}</button>)}
        </div>
    );
}

/**
 * Type guard for [AccessDeniedRetryProps].
 *
 * @param value the value to check.
 */
function isAccessDeniedRetryProps(value: any): value is AccessDeniedRetryProps {
    return "object" === typeof value
        && "allowRetry" in value
        && true === value.allowRetry;
}