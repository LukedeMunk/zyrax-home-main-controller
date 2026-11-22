/******************************************************************************
 *
 * File:    upload-fields.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders file and image upload fields with removable selections.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {button, element} from "../../core/dom.js";

/******************************************************************************/
/*!
 * @brief   Renders a file upload with a removable list of selected files.
 * @param   field                Upload field definition.
 * @param   value                Initial selected file or files.
 * @param   context              Field lifecycle services supplied by ModalForm.
 * @returns object              Rendered upload element, control, and value reader.
 */
/******************************************************************************/
export function fileUploadRenderer(field, value, context = {}) {
    return renderUpload(field, value, context, false);
}

/******************************************************************************/
/*!
 * @brief   Renders an image upload with removable local image previews.
 * @param   field                Upload field definition.
 * @param   value                Initial selected image or images.
 * @param   context              Field lifecycle services supplied by ModalForm.
 * @returns object              Rendered upload element, control, and value reader.
 */
/******************************************************************************/
export function imageUploadRenderer(field, value, context = {}) {
    return renderUpload(field, value, context, true);
}

/******************************************************************************/
/*!
 * @brief   Builds the shared file-selection interface used by upload renderers.
 * @param   field                Upload field definition.
 * @param   value                Initial selected file or files.
 * @param   context              Field lifecycle services supplied by ModalForm.
 * @param   showPreviews         Whether selected images receive previews.
 * @returns object              Rendered upload element, control, and value reader.
 */
/******************************************************************************/
function renderUpload(field, value, context, showPreviews) {
    let selectedFiles = normalizeFiles(value, field.multiple);
    const objectUrls = new Set();
    const inputElem = element("input", {
        className: "upload-native-input",
        type: "file",
        attributes: {
            id: field.name,
            name: field.name,
            accept: field.accept ?? (showPreviews ? "image/*" : undefined),
            multiple: field.multiple ? "" : undefined,
            required: field.required ? "" : undefined,
            disabled: field.disabled ? "" : undefined,
            "aria-label": field.label ?? field.name
        }
    });

    const selectButtonElem = button({
        text: field.buttonLabel ?? (field.multiple ? "Choose files" : "Choose file"),
        iconClass: field.buttonIcon ?? "fa-solid fa-upload",
        title: field.buttonLabel ?? (field.multiple ? "Choose files" : "Choose file"),
        className: "upload-select-button",
        disabled: field.disabled
    });
    selectButtonElem.setAttribute("aria-controls", field.name);

    const listElem = element("div", {
        className: showPreviews ? "image-upload-previews" : "file-upload-list",
        attributes: {"aria-live": "polite"}
    });

    const uploadElem = element("div", {
        className: showPreviews
            ? "upload-field image-upload-field"
            : "upload-field file-upload-field"
    }, [inputElem, selectButtonElem, listElem]);

    /******************************************************************************/
    /*!
     * @brief   Opens the native file chooser through the styled upload button.
     */
    /******************************************************************************/
    const openFileChooser = () => inputElem.click();

    /******************************************************************************/
    /*!
     * @brief   Rebuilds the selected-file list and any image object URLs.
     */
    /******************************************************************************/
    function renderFiles() {
        revokeObjectUrls(objectUrls);

        const items = selectedFiles.map((file, index) => createFileItem(file, index));

        listElem.replaceChildren(...items);
    }

    /******************************************************************************/
    /*!
     * @brief   Creates one selected-file item and its remove action.
     * @param   file                 Selected file represented by the item.
     * @param   index                Position of the file in the current selection.
     * @returns HTMLElement         Rendered file item.
     */
    /******************************************************************************/
    function createFileItem(file, index) {
        const nameElem = element("span", {className: "upload-file-name", text: file.name});
        const removeButtonElem = button({
            iconClass: "fa-solid fa-xmark",
            title: `Remove ${file.name}`,
            className: "upload-remove-button",
            dataset: {fileIndex: index}
        });
        removeButtonElem.setAttribute("aria-label", `Remove ${file.name}`);

        const children = [];

        if (showPreviews && file.type?.startsWith("image/") && globalThis.URL?.createObjectURL) {
            const objectUrl = globalThis.URL.createObjectURL(file);

            objectUrls.add(objectUrl);
            children.push(element("img", {
                className: "image-upload-preview",
                attributes: {src: objectUrl, alt: field.previewAlt?.(file) ?? file.name}
            }));
        }

        children.push(nameElem, removeButtonElem);

        const itemClass = showPreviews ? "image-upload-item" : "file-upload-item";
        const itemElem = element("div", {className: itemClass}, children);

        /******************************************************************************/
        /*!
         * @brief   Removes the selected file represented by this item.
         */
        /******************************************************************************/
        const handleRemove = () => {
            selectedFiles.splice(index, 1);

            synchronizeInputFiles(inputElem, selectedFiles);
            renderFiles();
        };
        context.listen?.(removeButtonElem, "click", handleRemove);

        return itemElem;
    }

    /******************************************************************************/
    /*!
     * @brief   Replaces the managed selection after a native file-input change.
     */
    /******************************************************************************/
    const handleChange = () => {
        selectedFiles = normalizeFiles([...inputElem.files], field.multiple);

        renderFiles();
    };

    /******************************************************************************/
    /*!
     * @brief   Releases every object URL owned by this upload field.
     */
    /******************************************************************************/
    const cleanup = () => revokeObjectUrls(objectUrls);

    /******************************************************************************/
    /*!
     * @brief   Returns the upload value using single- or multiple-file semantics.
     * @returns File|File[]|null Selected file value.
     */
    /******************************************************************************/
    const getValue = () => field.multiple ? [...selectedFiles] : selectedFiles[0] ?? null;

    context.listen?.(inputElem, "change", handleChange);
    context.listen?.(selectButtonElem, "click", openFileChooser);
    context.registerCleanup?.(cleanup);
    renderFiles();

    return {element: uploadElem, control: inputElem, getValue, ownsLabel: true};
}

/******************************************************************************/
/*!
 * @brief   Normalizes an upload value to the permitted number of files.
 * @param   value                File, FileList, file array, or empty value.
 * @param   multiple             Whether multiple files are permitted.
 * @returns File[]              Normalized selected files.
 */
/******************************************************************************/
function normalizeFiles(value, multiple) {
    if (!value) return [];

    const isIterable = typeof value !== "string" && typeof value[Symbol.iterator] === "function";
    const files = Array.isArray(value) ? value : isIterable ? [...value] : [value];

    return multiple ? files : files.slice(0, 1);
}

/******************************************************************************/
/*!
 * @brief   Mirrors a managed file selection back to the native input when supported.
 * @param   inputElem            Native file input.
 * @param   files                Files that should remain selected.
 */
/******************************************************************************/
function synchronizeInputFiles(inputElem, files) {
    if (typeof globalThis.DataTransfer !== "function") return;

    const transfer = new globalThis.DataTransfer();

    for (const file of files) transfer.items.add(file);
    inputElem.files = transfer.files;
}

/******************************************************************************/
/*!
 * @brief   Revokes and clears every object URL in a collection.
 * @param   objectUrls           Object URLs owned by an upload field.
 */
/******************************************************************************/
function revokeObjectUrls(objectUrls) {
    for (const objectUrl of objectUrls) globalThis.URL?.revokeObjectURL?.(objectUrl);
    objectUrls.clear();
}
