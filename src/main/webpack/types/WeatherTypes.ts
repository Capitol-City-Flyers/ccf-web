import {DateTime, Interval} from "luxon";

/**
 * Effectivity interval for a forecast or forecast element. The *start* and *end* may be expressed as a concrete
 * {@link DateTime} or as an {@link Interval} describing a transition period.
 */
type ForecastInterval = [DateTime | Interval, DateTime | Interval];
