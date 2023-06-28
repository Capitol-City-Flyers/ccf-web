import {freeze} from "immer";
import _ from "lodash";
import {DateTime} from "luxon";
import {isCodeElement, isCommentNode, isHRElement, isStrongElement, isTextNode} from "../../utilities/dom-utils";
import {MetarResponse} from "./nws-types";

/**
 * {@link NWSParser} parses HTTP responses for a {@link NWSClient} instance.
 */
export class NWSParser {
    private constructor() {
    }

    /**
     * Parse a `./metar/data` response, which may include a combination of Metars and/or TAFs.
     *
     * @param root the HTML root node.
     */
    parseMetarResponse(root: ParentNode): MetarResponse {

        /* Find the beginning of the Metar/TAF data; parse the timestamp. */
        const start = root.querySelector<HTMLParagraphElement>("p[clear=both]");
        const timestampText = _.last(start.querySelector<HTMLElement>("strong").textContent.split("Data at: "));
        const timestamp = DateTime.fromFormat(_.trim(timestampText), "HHmm 'UTC' d MMM yyyy", {zone: "UTC"});

        /* Scan through the data and extract Metar and/or TAF lines. */
        let nextNode = start.nextSibling;
        let foundData = false;
        let currentStation = null;
        const entriesByStation: { [Station in string]: string[][] } = {};
        while (null != nextNode) {
            if (isCommentNode(nextNode)) {
                const comment = _.trim(nextNode.textContent);
                if ("Data starts here" === comment) {
                    foundData = true;
                } else if ("Data ends here" === comment) {
                    break;
                }
            } else if (foundData) {
                if (isHRElement(nextNode)) {
                    currentStation = null;
                } else if (isStrongElement(nextNode)) {

                    /* Push an empty TAF array for stations without a TAF. */
                    if (null != currentStation && _.trim(nextNode.textContent).startsWith("No TAF found")) {
                        entriesByStation[currentStation].push([]);
                    }
                } else if (isCodeElement(nextNode)) {

                    /* Data is in <code> elements, with <br/> breaking lines in TAF only. */
                    const content = new Array<string>();
                    nextNode.childNodes.forEach(childNode => {
                        if (isTextNode(childNode)) {
                            const text = _.trim(childNode.textContent);
                            if ("" !== text) {
                                content.push(text);
                            }
                        }
                    });
                    if (!_.isEmpty(content)) {

                        /* Push next entry (Metar or TAF) for this station. */
                        currentStation = content[0].split(" ")[0];
                        if (!entriesByStation.hasOwnProperty(currentStation)) {
                            entriesByStation[currentStation] = [];
                        }
                        entriesByStation[currentStation].push(content);
                    }
                }
            }
            nextNode = nextNode.nextSibling;
        }

        /* Assemble Metar(s) and/or TAFs. */
        return _.transform(Object.entries(entriesByStation), (acc, [station, entries]) => {
            const taf = _.last(entries);
            acc.stations[station] = {
                metars: _.map(entries.slice(0, -1), 0),
                ...(_.isEmpty(taf) ? {} : {taf})
            }
        }, {stations: {}, timestamp});
    }

    /**
     * Create a {@link NWSParser} instance.
     */
    static create() {
        return freeze(new NWSParser(), true);
    }
}
