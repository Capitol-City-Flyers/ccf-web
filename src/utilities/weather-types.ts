import {Interval} from "luxon";
import {IAbstractWeatherContainer, ICloud, Visibility} from "metar-taf-parser";

/**
 * Flight category.
 */
export type FlightCategory =
    | "ifr"
    | "lifr"
    | "mvfr"
    | "vfr";

/**
 * Interval during which a flight category applied, and the conditions which were used to determine that category.
 */
export interface FlightCategoryInterval {

    /**
     * Flight category.
     */
    category: FlightCategory;

    /**
     * Individual condition intervals within the category interval.
     */
    conditions: {

        /**
         * Condition interval.
         */
        interval: Interval,

        /**
         * Conditions within the interval.
         */
        condition: FlightConditions,

        /**
         * Weather forecast or observation from which the conditions were derived.
         */
        weather: IAbstractWeatherContainer
    }[],

    /**
     * Category interval.
     */
    interval: Interval;
}

/**
 * Flight conditions contributing to {@link FlightCategoryInterval}: a ceiling and/or a visibility.
 */
export interface FlightConditions {

    /**
     * Weather forecast or observation from which the conditions were derived.
     */
    weather: IAbstractWeatherContainer;

    /**
     * Ceiling, if any.
     */
    ceiling?: ICloud;

    /**
     * Visibility limit, if any.
     */
    visibility?: Visibility;
}
