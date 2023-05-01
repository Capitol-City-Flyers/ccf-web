import React, {SyntheticEvent, useCallback, useEffect, useMemo, useState} from "react";
import {freeze, produce} from "immer";
import _ from "lodash";
import {DateTime, Interval} from "luxon";
import {useLocalDateTime} from "../../context/AppContext";
import {useMessages} from "../../context/MessagesContext";
import {DATE_WINDOWS, DateCalc, DateWindow} from "../../utils/DateCalc";
import {MessageKey} from "../../utils/MessageUtils";

export type DateWindowChangeHandler = (value: DateWindow, resolved: Interval) => void;

interface DateWindowSelectorProps {
    include?: Array<Exclude<DateWindow, Interval>>,
    includeCustom?: boolean;
    reference?: DateTime;
    value: DateWindow;
    onChange?: DateWindowChangeHandler;
}

export function DateWindowSelector(providedProps: DateWindowSelectorProps) {
    const {dateCalc} = useLocalDateTime(),
        actualProps = useMemo(() => applyDefaults(dateCalc, providedProps),
            [
                dateCalc,
                JSON.stringify(_.omitBy(providedProps, _.isFunction)),
                ..._.values(_.pickBy(providedProps, _.isFunction))
            ]),
        [state, updateState] =
            useState<Readonly<DateWindowSelectorState>>(() => {
                const {value} = actualProps;
                if (value instanceof Interval) {
                    return freeze({
                        resolved: value,
                        type: "custom"
                    });
                } else {
                    return freeze({
                        resolved: dateCalc.resolve(value, actualProps.reference),
                        type: value
                    });
                }
            }),
        messages = useMessages(messageKeysByDateWindow);

    /* Update state on "window" drop-down change. */
    const {reference} = actualProps;
    const onTypeChange = useCallback(({currentTarget: {value}}: SyntheticEvent<HTMLSelectElement>) => {
        updateState(previous => produce(previous, draft => {
            const type = value as DateWindowSelectorState["type"];
            if ("custom" === type) {

                /* Not doing custom manual entry right now. */
                throw Error("TODO");
            } else {
                draft.type = type;
                draft.resolved = dateCalc.resolve(type, reference);
            }
        }));
    }, [dateCalc, reference, updateState]);

    /* Invoke onChange when type and/or custom interval changes. */
    const {onChange} = actualProps;
    useEffect(() => {
        const {type, resolved} = state;
        if ("custom" === type) {
            onChange(resolved, resolved);
        } else {
            onChange(type, resolved);
        }
    }, [onChange, state]);
    return (
        <select className="select select-bordered w-full max-w-xs" value={state.type} onChange={onTypeChange}>
            {actualProps.includeCustom && (
                <option key="custom" value="custom">{messages.custom}</option>
            )}
            {actualProps.include.map(type => (
                <option key={type} value={type}>{messages[type]}</option>
            ))}
        </select>
    );
}

interface DateWindowSelectorState {
    type: "custom" | Exclude<DateWindow, Interval>;
    resolved: Interval;
}

const messageKeysByDateWindow: { [k in "custom" | typeof DATE_WINDOWS[number]]: MessageKey } = freeze({
    "custom": "ccf.label.custom",
    "current day": "ccf.period.today",
    "current month": "ccf.period.this-month",
    "current week": "ccf.period.this-week",
    "current weekend": "ccf.period.this-weekend",
    "next day": "ccf.period.tomorrow",
    "next month": "ccf.period.next-month",
    "next week": "ccf.period.next-week",
    "next weekend": "ccf.period.next-weekend",
    "previous day": "ccf.period.yesterday",
    "previous month": "ccf.period.last-month",
    "previous week": "ccf.period.last-week",
    "previous weekend": "ccf.period.last-weekend"
});

function applyDefaults(dates: DateCalc, props: DateWindowSelectorProps): Required<DateWindowSelectorProps> {
    return _.defaults({}, props, {
        include: DATE_WINDOWS,
        includeCustom: true,
        reference: dates.now().startOf("day"),
        onChange: _.noop
    });
}
