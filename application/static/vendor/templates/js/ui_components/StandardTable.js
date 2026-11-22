/******************************************************************************
 *
 * File:    StandardTable.js
 * Author:  Luke de Munk
 * Version: 0.1.0
 *
 * Brief:   Renders sortable data tables with icon-based row actions.
 * 
 *          Read-only
 *
 *          More information: https://github.com/LukedeMunk/templates
 *          Part of Templates library.
 *
 *****************************************************************************/
import {Component} from "../core/component.js";
import {button, element, icon} from "../core/dom.js";

export class StandardTable extends Component {
    /******************************************************************************/
    /*!
     * @brief   Initializes a new instance and its owned state.
     * @param   root                 Value supplied for root.
     * @param   props                Value supplied for props.
     */
    /******************************************************************************/
    constructor(root, props = {}) {
        super(root, props);
        this.searchText = "";
        this.sort = null;
        this.hiddenColumns = new Set();
        this.page = Math.max(1, Number(props.pagination?.page) || 1);
        this.filters = createInitialFilters(props.columns ?? []);
        this.openFilterKey = null;
    }

    /******************************************************************************/
    /*!
     * @brief   Updates the instance with the supplied data.
     * @param   nextProps            Value supplied for nextProps.
     * @returns *                    Result produced by the operation.
     */
    /******************************************************************************/
    update(nextProps = {}) {
        if (nextProps.search !== undefined) this.searchText = nextProps.search;
        if (nextProps.pagination?.page !== undefined) {
            this.page = Math.max(1, Number(nextProps.pagination.page) || 1);
        }

        if (nextProps.columns) this.filters = createInitialFilters(nextProps.columns);

        return super.update(nextProps);
    }

    /******************************************************************************/
    /*!
     * @brief   Renders the current state into the owned element.
     */
    /******************************************************************************/
    render() {
        this.resetListeners();

        const wrapper = element("section", {className: "standard-table"});

        if (this.props.title) wrapper.append(element("h3", {text: this.props.title}));

        if (this.props.loading) {
            wrapper.append(element("p", {
                className: "table-state",
                text: this.props.loadingMessage ?? "Loading…"
            }));
            return this.root.replaceChildren(wrapper);
        }

        if (this.props.error) {
            wrapper.append(element("p", {
                className: "table-state error-message",
                text: this.props.error
            }));
            return this.root.replaceChildren(wrapper);
        }

        const columns = (this.props.columns ?? []).filter(column =>
            !this.hiddenColumns.has(column.key)
        );

        const table = element("table", {
            attributes: {"aria-label": this.props.title ?? "Data table"}
        });

        const headerRow = element("tr");

        for (const column of columns) {
            const heading = element("th", {attributes: {scope: "col"}});
            const canSort = column.sortable !== false;
            const hasFilters = (column.filterOptions?.length ?? 0) > 0;

            if (!canSort && !hasFilters) {
                heading.textContent = column.title ?? column.key;
            } else {
                const label = element("span", {text: column.title ?? column.key});
                const controls = [label];

                if (hasFilters) controls.push(this.#renderFilter(column));
                if (canSort) {
                    const sortButton = button({
                        iconClass: this.#sortIcon(column.key),
                        title: this.#sortTitle(column.key),
                        className: "table-sort-button",
                        dataset: {sort: column.key}
                    });

                    const title = column.title ?? column.key;
                    const sortLabel = `${this.#sortTitle(column.key)}: ${title}`;

                    sortButton.setAttribute("aria-label", sortLabel);
                    heading.setAttribute("aria-sort", this.#ariaSort(column.key));

                    /******************************************************************************/
                    /*!
                     * @brief   Toggles sorting for the selected table column.
                     */
                    /******************************************************************************/
                    const toggleSort = () => this.#toggleSort(column.key);

                    this.listen(sortButton, "click", toggleSort);
                    controls.push(sortButton);
                }

                heading.append(element("span", {className: "table-heading-content"}, controls));
            }

            headerRow.append(heading);
        }

        table.append(element("thead", {}, [headerRow]));

        const body = element("tbody");
        const processedRows = this.#visibleRows();
        const pagination = createPaginationState(
            this.props.pagination,
            processedRows.length,
            this.page
        );

        this.page = pagination.page;

        const rows = pagination.mode === "local"
            ? paginateRows(processedRows, pagination)
            : processedRows;
        if (rows.length === 0) {
            const cell = element("td", {text: this.props.emptyMessage ?? "No results."});
            cell.colSpan = Math.max(columns.length, 1);
            body.append(element("tr", {className: "table-empty-row"}, [cell]));
        } else {
            for (const row of rows) body.append(this.#renderRow(row, columns));
        }

        table.append(body);
        wrapper.append(table);

        if (pagination.enabled) wrapper.append(this.#renderPagination(pagination));
        this.root.replaceChildren(wrapper);
    }

    /******************************************************************************/
    /*!
     * @brief   Applies a normalized search query and rerenders the table.
     * @param   query                Search text to apply.
     */
    /******************************************************************************/
    search(query = "") {
        this.searchText = String(query).trim().toLocaleLowerCase();
        this.page = 1;
        this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Changes whether a table column is visible.
     * @param   key                  Column key to update.
     * @param   visible              Explicit visibility or undefined to toggle.
     */
    /******************************************************************************/
    toggleColumn(key, visible) {
        const shouldShow = visible ?? this.hiddenColumns.has(key);

        if (shouldShow) this.hiddenColumns.delete(key);
        else this.hiddenColumns.add(key);
        this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Replaces active values for a column filter and reports the change.
     * @param   key                  Column key whose filter should change.
     * @param   values               Values that should remain active.
     */
    /******************************************************************************/
    setColumnFilters(key, values = []) {
        const column = (this.props.columns ?? []).find(candidate => candidate.key === key);

        if (!column?.filterOptions) return;

        const allowedValues = new Set(column.filterOptions.map(option => String(option.value)));
        const normalizedValues = values.map(String).filter(value => allowedValues.has(value));
        const selectedValues = new Set(normalizedValues);

        this.filters.set(key, selectedValues);
        this.page = 1;
        this.emit("filter-change", {
            key,
            values: [...selectedValues],
            filters: serializeFilters(this.filters)
        });

        if (this.mounted) this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Changes the current page and reports the new pagination state.
     * @param   page                 Requested one-based page number.
     */
    /******************************************************************************/
    setPage(page) {
        const processedRows = this.#visibleRows();
        const pagination = createPaginationState(this.props.pagination, processedRows.length, page);

        if (!pagination.enabled || pagination.page === this.page) return;

        this.page = pagination.page;
        this.emit("page-change", {
            page: pagination.page,
            itemsPerPage: pagination.itemsPerPage,
            totalItems: pagination.totalItems,
            totalPages: pagination.totalPages,
            mode: pagination.mode
        });

        if (this.mounted) this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Filters and sorts rows for the current table state.
     * @returns object[]            Rows currently visible in the table.
     */
    /******************************************************************************/
    #visibleRows() {
        return processRows(this.props.rows ?? [], this.searchText, this.sort, this.filters);
    }

    /******************************************************************************/
    /*!
     * @brief   Renders one column filter button and its optional choices.
     * @param   column               Filterable column definition.
     * @returns HTMLElement         Filter control wrapper.
     */
    /******************************************************************************/
    #renderFilter(column) {
        const selectedValues = this.filters.get(column.key) ?? new Set();
        const isOpen = this.openFilterKey === column.key;
        const filterTitle = column.filterTitle ?? `Filter ${column.title ?? column.key}`;
        const className = selectedValues.size > 0
            ? "table-filter-button active"
            : "table-filter-button";
        const filterButtonElem = button({
            iconClass: selectedValues.size > 0
                ? "fa-duotone fa-solid fa-filter-list"
                : "fa-duotone fa-solid fa-filter",
            title: filterTitle,
            className,
            dataset: {filter: column.key}
        });
        filterButtonElem.setAttribute("aria-label", filterTitle);
        filterButtonElem.setAttribute("aria-expanded", String(isOpen));
        filterButtonElem.setAttribute("aria-haspopup", "true");

        /******************************************************************************/
        /*!
         * @brief   Opens or closes the selected column's filter choices.
         */
        /******************************************************************************/
        const toggleMenu = () => this.#toggleFilterMenu(column.key);

        this.listen(filterButtonElem, "click", toggleMenu);

        const wrapperElem = element("span", {className: "table-filter-control"}, [
            filterButtonElem
        ]);

        if (!isOpen) return wrapperElem;

        const menuElem = element("div", {
            className: "table-filter-container show",
            attributes: {role: "group", "aria-label": filterTitle}
        });

        for (const option of column.filterOptions) {
            const checkboxElem = element("input", {
                type: "checkbox",
                attributes: {disabled: option.disabled ? "" : undefined}
            });
            checkboxElem.checked = selectedValues.has(String(option.value));

            const children = [checkboxElem];

            if (option.icon) children.push(icon(option.icon));
            children.push(element("span", {text: option.label ?? option.text ?? option.value}));

            const itemElem = element("label", {className: "table-filter-item-container"}, children);

            /******************************************************************************/
            /*!
             * @brief   Applies the selected state of one column filter option.
             */
            /******************************************************************************/
            const applyFilter = () => this.#toggleColumnFilter(column.key, option.value);

            this.listen(checkboxElem, "change", applyFilter);
            menuElem.append(itemElem);
        }

        /******************************************************************************/
        /*!
         * @brief   Closes the active filter menu when Escape is pressed.
         * @param   event                Filter-menu keyboard event.
         */
        /******************************************************************************/
        const closeOnEscape = event => {
            if (event.key !== "Escape") return;

            event.preventDefault();
            this.openFilterKey = null;
            this.render();
            this.#findFilterButton(column.key)?.focus();
        };
        this.listen(menuElem, "keydown", closeOnEscape);
        wrapperElem.append(menuElem);

        return wrapperElem;
    }

    /******************************************************************************/
    /*!
     * @brief   Renders icon-only pagination controls and a readable page status.
     * @param   pagination           Normalized pagination state.
     * @returns HTMLElement         Pagination navigation element.
     */
    /******************************************************************************/
    #renderPagination(pagination) {
        const navigationElem = element("nav", {
            className: "table-pagination",
            attributes: {"aria-label": this.props.pagination?.label ?? "Table pages"}
        });

        const actions = [
            {
                page: 1,
                icon: "fa-solid fa-angles-left",
                label: "First page",
                disabled: !pagination.hasPrevious
            },
            {
                page: pagination.page - 1,
                icon: "fa-solid fa-chevron-left",
                label: "Previous page",
                disabled: !pagination.hasPrevious
            },
            {
                page: pagination.page + 1,
                icon: "fa-solid fa-chevron-right",
                label: "Next page",
                disabled: !pagination.hasNext
            },
            {
                page: pagination.totalPages,
                icon: "fa-solid fa-angles-right",
                label: "Last page",
                disabled: !pagination.hasNext
            }
        ];

        for (const action of actions) {
            const controlElem = button({
                iconClass: action.icon,
                title: action.label,
                className: "table-pagination-button",
                disabled: action.disabled,
                dataset: {page: action.page}
            });
            controlElem.setAttribute("aria-label", action.label);

            /******************************************************************************/
            /*!
             * @brief   Navigates to the page represented by a pagination control.
             */
            /******************************************************************************/
            const handlePageClick = () => this.setPage(action.page);

            this.listen(controlElem, "click", handlePageClick);
            navigationElem.append(controlElem);
        }

        const statusElem = element("span", {
            className: "table-pagination-status",
            text: `Page ${pagination.page} of ${pagination.totalPages}`,
            attributes: {"aria-live": "polite"}
        });

        navigationElem.children[1].after(statusElem);

        return navigationElem;
    }

    /******************************************************************************/
    /*!
     * @brief   Opens the requested filter menu or closes the currently open menu.
     * @param   key                  Column key whose menu should be toggled.
     */
    /******************************************************************************/
    #toggleFilterMenu(key) {
        const shouldOpen = this.openFilterKey !== key;

        this.openFilterKey = shouldOpen ? key : null;
        this.render();

        const filterButtonElem = this.#findFilterButton(key);

        if (shouldOpen) filterButtonElem?.parentElement.querySelector("input")?.focus();
        else filterButtonElem?.focus();
    }

    /******************************************************************************/
    /*!
     * @brief   Toggles one filter value for a column.
     * @param   key                  Column key whose filter should change.
     * @param   value                Filter value to toggle.
     */
    /******************************************************************************/
    #toggleColumnFilter(key, value) {
        const selectedValues = new Set(this.filters.get(key) ?? []);
        const normalizedValue = String(value);

        if (selectedValues.has(normalizedValue)) selectedValues.delete(normalizedValue);
        else selectedValues.add(normalizedValue);
        this.setColumnFilters(key, [...selectedValues]);
        this.#findFilterButton(key)?.focus();
    }

    /******************************************************************************/
    /*!
     * @brief   Finds the rendered filter button for a column key.
     * @param   key                  Column key to locate.
     * @returns HTMLButtonElement|null Matching filter button.
     */
    /******************************************************************************/
    #findFilterButton(key) {
        return [...this.root.querySelectorAll("[data-filter]")].find(controlElem =>
            controlElem.dataset.filter === key
        ) ?? null;
    }

    /******************************************************************************/
    /*!
     * @brief   Renders one data row for the supplied visible columns.
     * @param   row                  Row data to render.
     * @param   columns              Visible column definitions.
     * @returns HTMLTableRowElement Rendered table row.
     */
    /******************************************************************************/
    #renderRow(row, columns) {
        const tableRow = element("tr", {dataset: {rowId: row.id ?? ""}});

        for (const column of columns) {
            const cell = element("td");

            if (column.actions) {
                for (const action of column.actions) {
                    const actionButton = button({
                        iconClass: action.icon ?? "fa-solid fa-pen-to-square",
                        title: action.title ?? action.label,
                        className: "table-action-button",
                        disabled: action.disabled,
                        dataset: {action: action.name}
                    });

                    const actionLabel = action.title ?? action.label ?? action.name;

                    actionButton.setAttribute("aria-label", actionLabel);

                    /******************************************************************************/
                    /*!
                     * @brief   Reports the selected action and its associated row.
                     */
                    /******************************************************************************/
                    this.listen(actionButton, "click", () => this.emit("row-action", {
                        action: action.name,
                        row
                    }));
                    cell.append(actionButton);
                }
            } else if (typeof column.render === "function") {
                const rendered = column.render(row[column.key], row);
                const content = rendered instanceof Node
                    ? rendered
                    : document.createTextNode(String(rendered ?? ""));
                cell.append(content);
            } else {
                cell.textContent = String(row[column.key] ?? "");
            }

            tableRow.append(cell);
        }

        return tableRow;
    }

    /******************************************************************************/
    /*!
     * @brief   Toggles the sort direction for a column and rerenders the table.
     * @param   key                  Column key to sort.
     */
    /******************************************************************************/
    #toggleSort(key) {
        const direction = this.sort?.key === key ? this.sort.direction * -1 : 1;

        this.sort = {key, direction};
        this.emit("sort", this.sort);
        this.render();
    }

    /******************************************************************************/
    /*!
     * @brief   Gets the accessible sort state for a column.
     * @param   key                  Column key to inspect.
     * @returns string              ARIA sort state.
     */
    /******************************************************************************/
    #ariaSort(key) {
        if (this.sort?.key !== key) return "none";

        return this.sort.direction === 1 ? "ascending" : "descending";
    }

    /******************************************************************************/
    /*!
     * @brief   Selects the icon for a column's current sort state.
     * @param   key                  Column key to inspect.
     * @returns string              Font Awesome icon class.
     */
    /******************************************************************************/
    #sortIcon(key) {
        if (this.sort?.key !== key) return "fa-duotone fa-solid fa-arrow-down-arrow-up";

        return this.sort.direction === 1
            ? "fa-duotone fa-solid fa-arrow-down-short-wide"
            : "fa-duotone fa-solid fa-arrow-up-short-wide";
    }

    /******************************************************************************/
    /*!
     * @brief   Describes the next sort action available for a column.
     * @param   key                  Column key to inspect.
     * @returns string              Accessible sort-action title.
     */
    /******************************************************************************/
    #sortTitle(key) {
        if (this.sort?.key !== key) return "Sort ascending";

        return this.sort.direction === 1 ? "Sort descending" : "Clear sorting";
    }
}

/******************************************************************************/
/*!
 * @brief   Filters and sorts rows before local pagination is applied.
 * @param   rows                 Source rows.
 * @param   searchText           Normalized search text.
 * @param   sort                 Active sort key and direction.
 * @param   filters              Active values indexed by column key.
 * @returns object[]            Processed row copy.
 */
/******************************************************************************/
export function processRows(rows, searchText = "", sort = null, filters = new Map()) {
    let processedRows = [...rows];

    for (const [key, selectedValues] of filters) {
        if (selectedValues.size === 0) continue;

        processedRows = processedRows.filter(row => selectedValues.has(String(row[key] ?? "")));
    }

    if (searchText) {
        processedRows = processedRows.filter(row => Object.values(row).some(value =>
            String(value ?? "").toLocaleLowerCase().includes(searchText)
        ));
    }

    if (sort) {
        const {key, direction} = sort;
        processedRows.sort((left, right) => String(left[key] ?? "").localeCompare(
            String(right[key] ?? ""), undefined, {numeric: true, sensitivity: "base"}
        ) * direction);
    }

    return processedRows;
}

/******************************************************************************/
/*!
 * @brief   Reads initially selected filter values from column definitions.
 * @param   columns              Table column definitions.
 * @returns Map                 Selected filter values indexed by column key.
 */
/******************************************************************************/
export function createInitialFilters(columns) {
    return new Map(columns.filter(column => column.filterOptions).map(column => [
        column.key,
        new Set(column.filterOptions.filter(option => option.selected).map(option =>
            String(option.value)
        ))
    ]));
}

/******************************************************************************/
/*!
 * @brief   Converts filter sets into serializable event detail.
 * @param   filters              Filter values indexed by column key.
 * @returns object              Active values indexed by column key.
 */
/******************************************************************************/
function serializeFilters(filters) {
    return Object.fromEntries([...filters].map(([key, values]) => [key, [...values]]));
}

/******************************************************************************/
/*!
 * @brief   Normalizes local or server-driven pagination configuration.
 * @param   configuration        Optional pagination configuration.
 * @param   localTotal           Number of locally processed rows.
 * @param   requestedPage        Requested one-based page number.
 * @returns object              Normalized pagination state.
 */
/******************************************************************************/
export function createPaginationState(configuration, localTotal, requestedPage) {
    const mode = configuration?.mode === "server" ? "server" : "local";
    const itemsPerPage = Math.max(1, Number(configuration?.itemsPerPage) || 10);
    const totalItems = mode === "server"
        ? Math.max(0, Number(configuration?.totalItems) || 0)
        : localTotal;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const page = Math.min(totalPages, Math.max(1, Number(requestedPage) || 1));

    return {
        enabled: Boolean(configuration) && totalPages > 1,
        mode,
        page,
        itemsPerPage,
        totalItems,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages
    };
}

/******************************************************************************/
/*!
 * @brief   Returns the rows belonging to a normalized local page.
 * @param   rows                 Filtered and sorted rows.
 * @param   pagination           Normalized pagination state.
 * @returns object[]            Rows for the current page.
 */
/******************************************************************************/
export function paginateRows(rows, pagination) {
    const start = (pagination.page - 1) * pagination.itemsPerPage;

    return rows.slice(start, start + pagination.itemsPerPage);
}
