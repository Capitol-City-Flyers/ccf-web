/* Replace version tag in HTML/JSON files after semantic release. Trigger in the NPM "postversion" hook. */
const replace = require("replace-in-file");
const version = process.env["npm_new_version"];
replace({
    files: [
        "./out/**/*.html",
        "./out/**/*.json"
    ],
    from: /@@:VERSION=(.*):@@/g,
    to: `@@:VERSION=${version}:@@`
}).then(found => {
    const changed = found.filter(({hasChanged}) => hasChanged).map(({file}) => file);
    console.log(`Set version [${version}] in ${changed.length} file(s).`, changed);
});
