/******************************************************************************
 *
 * File:    validation.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Provides reusable field and password validation rules.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
export const passwordRequirements = Object.freeze([
    Object.freeze({key: "length", label: "Use between 8 and 64 characters", test: hasValidLength}),
    Object.freeze({key: "uppercase", label: "Include an upper-case letter", test: hasUppercase}),
    Object.freeze({key: "lowercase", label: "Include a lower-case letter", test: hasLowercase}),
    Object.freeze({key: "number", label: "Include a number", test: hasNumber}),
    Object.freeze({key: "symbol", label: "Include a symbol", test: hasSymbol})
]);

export const validators = Object.freeze({
    required: validateRequired,
    email: validateEmail,
    minLength: createMinimumLengthValidator,
    maxLength: createMaximumLengthValidator,
    pattern: createPatternValidator,
    min: createMinimumValidator,
    max: createMaximumValidator,
    passwordRequirements: validatePasswordRequirements
});

/******************************************************************************/
/*!
 * @brief   Determines whether a password has an accepted length.
 * @param   value                Password value to inspect.
 * @returns boolean             Whether the length is between 8 and 64 characters.
 */
/******************************************************************************/
function hasValidLength(value) {
    return String(value ?? "").length >= 8 && String(value ?? "").length <= 64;
}

/******************************************************************************/
/*!
 * @brief   Determines whether a password contains an upper-case letter.
 * @param   value                Password value to inspect.
 * @returns boolean             Whether an upper-case letter is present.
 */
/******************************************************************************/
function hasUppercase(value) {
    return /[A-Z]/.test(String(value ?? ""));
}

/******************************************************************************/
/*!
 * @brief   Determines whether a password contains a lower-case letter.
 * @param   value                Password value to inspect.
 * @returns boolean             Whether a lower-case letter is present.
 */
/******************************************************************************/
function hasLowercase(value) {
    return /[a-z]/.test(String(value ?? ""));
}

/******************************************************************************/
/*!
 * @brief   Determines whether a password contains a number.
 * @param   value                Password value to inspect.
 * @returns boolean             Whether a number is present.
 */
/******************************************************************************/
function hasNumber(value) {
    return /\d/.test(String(value ?? ""));
}

/******************************************************************************/
/*!
 * @brief   Determines whether a password contains an accepted symbol.
 * @param   value                Password value to inspect.
 * @returns boolean             Whether an accepted symbol is present.
 */
/******************************************************************************/
function hasSymbol(value) {
    return /[-+!$%^&*()_|~=:@#;<>?,.\/\\]/.test(String(value ?? ""));
}

/******************************************************************************/
/*!
 * @brief   Validates that a required value is present.
 * @param   value                Field value to validate.
 * @returns boolean|string      True when valid, otherwise an error message.
 */
/******************************************************************************/
function validateRequired(value) {
    return hasValue(value) || "This field is required.";
}

/******************************************************************************/
/*!
 * @brief   Validates an optional email address.
 * @param   value                Field value to validate.
 * @returns boolean|string      True when valid, otherwise an error message.
 */
/******************************************************************************/
function validateEmail(value) {
    return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Enter a valid email address.";
}

/******************************************************************************/
/*!
 * @brief   Creates a minimum-length field validator.
 * @param   length               Minimum accepted character count.
 * @returns Function            Configured field validator.
 */
/******************************************************************************/
function createMinimumLengthValidator(length) {
    /******************************************************************************/
    /*!
     * @brief   Validates a value against the configured minimum length.
     * @param   value                Field value to validate.
     * @returns boolean|string      True when valid, otherwise an error message.
     */
    /******************************************************************************/
    return function validateMinimumLength(value) {
        return !value || String(value).length >= length || `Use at least ${length} characters.`;
    };
}

/******************************************************************************/
/*!
 * @brief   Creates a maximum-length field validator.
 * @param   length               Maximum accepted character count.
 * @returns Function            Configured field validator.
 */
/******************************************************************************/
function createMaximumLengthValidator(length) {
    /******************************************************************************/
    /*!
     * @brief   Validates a value against the configured maximum length.
     * @param   value                Field value to validate.
     * @returns boolean|string      True when valid, otherwise an error message.
     */
    /******************************************************************************/
    return function validateMaximumLength(value) {
        return !value || String(value).length <= length || `Use at most ${length} characters.`;
    };
}

/******************************************************************************/
/*!
 * @brief   Creates a regular-expression field validator.
 * @param   pattern              Regular expression that valid input must match.
 * @param   message              Error message returned for invalid input.
 * @returns Function            Configured field validator.
 */
/******************************************************************************/
function createPatternValidator(pattern, message = "The value has an invalid format.") {
    /******************************************************************************/
    /*!
     * @brief   Validates a value against the configured regular expression.
     * @param   value                Field value to validate.
     * @returns boolean|string      True when valid, otherwise an error message.
     */
    /******************************************************************************/
    return function validatePattern(value) {
        return !value || pattern.test(value) || message;
    };
}

/******************************************************************************/
/*!
 * @brief   Creates a minimum numeric-value validator.
 * @param   minimum              Minimum accepted value.
 * @returns Function            Configured field validator.
 */
/******************************************************************************/
function createMinimumValidator(minimum) {
    /******************************************************************************/
    /*!
     * @brief   Validates a value against the configured numeric minimum.
     * @param   value                Field value to validate.
     * @returns boolean|string      True when valid, otherwise an error message.
     */
    /******************************************************************************/
    return function validateMinimum(value) {
        return value === "" || Number(value) >= minimum || `Use a value of at least ${minimum}.`;
    };
}

/******************************************************************************/
/*!
 * @brief   Creates a maximum numeric-value validator.
 * @param   maximum              Maximum accepted value.
 * @returns Function            Configured field validator.
 */
/******************************************************************************/
function createMaximumValidator(maximum) {
    /******************************************************************************/
    /*!
     * @brief   Validates a value against the configured numeric maximum.
     * @param   value                Field value to validate.
     * @returns boolean|string      True when valid, otherwise an error message.
     */
    /******************************************************************************/
    return function validateMaximum(value) {
        return value === "" || Number(value) <= maximum || `Use a value of at most ${maximum}.`;
    };
}

/******************************************************************************/
/*!
 * @brief   Validates a password against every configured password requirement.
 * @param   value                Password value to validate.
 * @returns boolean|string      True when valid, otherwise an error message.
 */
/******************************************************************************/
function validatePasswordRequirements(value) {
    return passwordRequirements.every(requirement => requirement.test(value))
        || "Use 8–64 characters with upper-case, lower-case, number and symbol.";
}

/******************************************************************************/
/*!
 * @brief   Validates field values and returns errors indexed by field name.
 * @param   fields               Value supplied for fields.
 * @param   values               Value supplied for values.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
export function validateFields(fields, values) {
    const errors = {};

    for (const field of fields) {
        const isGroup = field.type === "field-group";
        const value = isGroup ? values : values[field.name];
        const configuredResult = validateConfiguredField(field, value);

        if (configuredResult !== true) errors[field.name] = configuredResult;
        for (const validate of field.validators ?? []) {
            if (errors[field.name]) break;

            const result = validate(value, values);

            if (result !== true) {
                errors[field.name] = result || "Invalid value.";
                break;
            }
        }

        if (isGroup) Object.assign(errors, validateFields(field.fields ?? [], values));
    }

    return errors;
}

/******************************************************************************/
/*!
 * @brief   Applies validation implied directly by a field definition.
 * @param   field                Field definition to validate.
 * @param   value                Current field value.
 * @returns boolean|string      True when valid, otherwise an error message.
 */
/******************************************************************************/
function validateConfiguredField(field, value) {
    if (field.type !== "field-group" && field.required && !hasValue(value)) {
        return "This field is required.";
    }

    if (field.type !== "file-upload" && field.type !== "image-upload") return true;

    const files = normalizeFileValue(value);
    const maximumSize = field.maxSize ?? field.maxFileSize;

    if (maximumSize && files.some(file => Number(file.size) > maximumSize)) {
        return `Each file must be no larger than ${maximumSize} bytes.`;
    }

    const accept = field.accept ?? (field.type === "image-upload" ? "image/*" : "");

    if (accept && files.some(file => !matchesAcceptedFile(file, accept))) {
        return `Select files matching: ${accept}.`;
    }

    return true;
}

/******************************************************************************/
/*!
 * @brief   Determines whether a file matches an HTML accept expression.
 * @param   file                 File-like value to inspect.
 * @param   accept               Comma-separated MIME types or extensions.
 * @returns boolean             Whether the file is accepted.
 */
/******************************************************************************/
export function matchesAcceptedFile(file, accept) {
    const rules = String(accept).split(",").map(rule => rule.trim().toLowerCase()).filter(Boolean);

    if (rules.length === 0) return true;

    const type = String(file.type ?? "").toLowerCase();
    const name = String(file.name ?? "").toLowerCase();

    return rules.some(rule => {
        if (rule.startsWith(".")) return name.endsWith(rule);
        if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));

        return type === rule;
    });
}

/******************************************************************************/
/*!
 * @brief   Normalizes a file field value to an array.
 * @param   value                File, file array, or empty value.
 * @returns File[]              Normalized files.
 */
/******************************************************************************/
function normalizeFileValue(value) {
    if (!value) return [];

    return Array.isArray(value) ? value : [value];
}

/******************************************************************************/
/*!
 * @brief   Determines whether a value satisfies required-field semantics.
 * @param   value                Value supplied for value.
 * @returns *                    Result produced by the operation.
 */
/******************************************************************************/
function hasValue(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;

    return value !== undefined && value !== null && value !== "";
}
