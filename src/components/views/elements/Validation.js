/*
Copyright 2019 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import classNames from 'classnames';

/**
 * Creates a validation function from a set of rules describing what to validate.
 *
 * @param {Function} description
 *     Function that returns a string summary of the kind of value that will
 *     meet the validation rules. Shown at the top of the validation feedback.
 * @param {Object} rules
 *     An array of rules describing how to check to input value. Each rule in an object
 *     and may have the following properties:
 *     - `key`: A unique ID for the rule. Required.
 *     - `test`: A function used to determine the rule's current validity. Required.
 *     - `valid`: Function returning text to show when the rule is valid. Only shown if set.
 *     - `invalid`: Function returning text to show when the rule is invalid. Only shown if set.
 * @returns {Function}
 *     A validation function that takes in the current input value and returns
 *     the overall validity and a feedback UI that can be rendered for more detail.
 */
export default function withValidation({ description, rules }) {
    return function onValidate({ value, focused, allowEmpty = true }) {
        // TODO: Re-run only after ~200ms of inactivity
        if (!value && allowEmpty) {
            return {
                valid: null,
                feedback: null,
            };
        }

        const results = [];
        let valid = true;
        if (rules && rules.length) {
            for (const rule of rules) {
                if (!rule.key || !rule.test) {
                    continue;
                }
                // We're setting `this` to whichever component hold the validation
                // function. That allows rules to access the state of the component.
                /* eslint-disable babel/no-invalid-this */
                const ruleValid = rule.test.call(this, { value, allowEmpty });
                valid = valid && ruleValid;
                if (ruleValid && rule.valid) {
                    // If the rule's result is valid and has text to show for
                    // the valid state, show it.
                    results.push({
                        key: rule.key,
                        valid: true,
                        text: rule.valid.call(this),
                    });
                } else if (!ruleValid && rule.invalid) {
                    // If the rule's result is invalid and has text to show for
                    // the invalid state, show it.
                    results.push({
                        key: rule.key,
                        valid: false,
                        text: rule.invalid.call(this),
                    });
                }
                /* eslint-enable babel/no-invalid-this */
            }
        }

        // Hide feedback when not focused
        if (!focused) {
            return {
                valid,
                feedback: null,
            };
        }

        let details;
        if (results && results.length) {
            details = <ul className="mx_Validation_details">
                {results.map(result => {
                    const classes = classNames({
                        "mx_Validation_detail": true,
                        "mx_Validation_valid": result.valid,
                        "mx_Validation_invalid": !result.valid,
                    });
                    return <li key={result.key} className={classes}>
                        {result.text}
                    </li>;
                })}
            </ul>;
        }

        let summary;
        if (description) {
            summary = <div className="mx_Validation_description">{description()}</div>;
        }

        let feedback;
        if (summary || details) {
            feedback = <div className="mx_Validation">
                {summary}
                {details}
            </div>;
        }

        return {
            valid,
            feedback,
        };
    };
}
