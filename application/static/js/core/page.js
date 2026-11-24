/****************************************************************************/
/*
 * File:    page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Initializes the ZyraX shell and owns resources for one page visit.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_GET_PROFILE_PICTURE, API_URL_LOGOUT, API_URL_UPDATE_ALARM
} from "../domain/endpoints.js";
import {
    BannerManager, FloatingNavigationBar, PopupManager
} from "../../vendor/templates/js/ui_components/index.js";
import { HttpClient } from "../../vendor/templates/js/core/http-client.js";
import * as labels from "../domain/language_pack_english.js";
import { submitForm } from "../services/forms.js";

const themes = ["dark", "light", "dark-green", "light-green"];

/****************************************************************************/
/*!
 * @brief   Applies the selected theme and records it for the current session.
 * @param   value                   Value to apply or format.
 */
/****************************************************************************/
export function applyTheme(value) {
    const theme = themes[value] ?? themes[matchMedia("(prefers-color-scheme: dark)").matches ? 0 : 1];
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(theme);
    sessionStorage.setItem("theme", String(themes.indexOf(theme)));
}

/****************************************************************************/
/*!
 * @brief   Returns the storage used for the current profile preference.
 * @returns The storage used for the current profile preference.
 */
/****************************************************************************/
export function profileStorage() {
    return localStorage.getItem("rememberUser") === "true" ? localStorage : sessionStorage;
}

/****************************************************************************/
/*!
 * @brief   Initializes page services and disposes their resources when the
 *          page is left.
 * @param   section                 Active page section.
 * @returns HTTP client, notifications, lifecycle signal and owned components.
 */
/****************************************************************************/
export function mountPage(section) {
    const events = new AbortController();
    const { signal } = events;
    const shell = document.querySelector("#shellData").dataset;
    const popup = new PopupManager(document.querySelector('[data-ref="confirmations"]')).mount();
    const banners = new BannerManager(document.querySelector('[data-ref="notifications"]')).mount();
    const http = new HttpClient({
        onUnauthorized() {
            if (section !== "login" && section !== "setup") location.assign("/login");
        }
    });
    const components = [popup, banners];

    applyTheme(sessionStorage.getItem("theme") ?? undefined);
    document.body.classList.add("loaded");
    document.documentElement.style.setProperty(
        "--profile-picture-url", `url("${API_URL_GET_PROFILE_PICTURE}")`
    );

    if (section !== "login" && section !== "setup") {
        if (!profileStorage().getItem("profileId")) location.assign("/login");

        const root = document.querySelector('[data-ref="main-navigation"]');
        const items = [[
            "devices", labels.TEXT_DEVICES, "./devices", "fa-duotone fa-solid fa-microchip"
        ], [
            "automations", labels.TEXT_AUTOMATIONS, "./automations", "fa-duotone fa-calendar-week"
        ], ["dashboard", labels.TEXT_DASHBOARD, "./", "fa-duotone fa-grid-horizontal"], [
            "configuration", labels.TEXT_CONFIGURATION, "./configuration", "fa-duotone fa-gears"
        ]].map(([key, label, href, icon]) => ({ label, href, icon, selected: section === key }));

        items.push({
            title: labels.TEXT_ACCOUNT_INFORMATION,
            icon: "profile-navigation-image",
            items: [{
                label: labels.TEXT_MANAGE_PROFILE,
                href: "./account#accountContainer",
                icon: "fa-duotone fa-regular fa-users"
            }, {
                label: labels.TEXT_MANAGE_ACCOUNT,
                href: "./account#profileContainer",
                icon: "fa-duotone fa-regular fa-user"
            }, {
                label: labels.TEXT_HELP,
                href: "https://zyraxhome.munkservices.com/",
                icon: "fa-duotone fa-solid fa-circle-info"
            }, {
                label: labels.TEXT_LOGOUT,
                action: "logout",
                icon: "fa-duotone fa-solid fa-arrow-right-to-arc"
            }, { label: shell.version, disabled: true }]
        });
        components.push(new FloatingNavigationBar(root, { items, location: "bottom" }).mount());

        /****************************************************************************/
        /*!
         * @brief   Handles shell logout actions and clears the stored profile session.
         * @param   detail                  Data reported by the component event.
         */
        /****************************************************************************/
        root.addEventListener("ui:action", ({ detail }) => {
            if (detail.action === "logout") {
                localStorage.removeItem("profileId");
                sessionStorage.removeItem("profileId");
                sessionStorage.removeItem("loggedIn");
                location.assign(API_URL_LOGOUT);
            }
        }, { signal });
    }

    if (shell.alarm === "true") {
        popup.show({
            title: labels.TEXT_ALARM_ACTIVATED,
            message: labels.TEXT_Q_DEACTIVATE_ALARM,
            type: "warning",
            actions: [{
                name: "deactivate",
                label: labels.TEXT_DEACTIVATE,

                /****************************************************************************/
                /*!
                 * @brief   Deactivates the alarm and reports the controller response.
                 */
                /****************************************************************************/
                async onAction() {
                    try {
                        await submitForm(http, API_URL_UPDATE_ALARM, { activated: 0 }, signal);
                        banners.show({
                            title: labels.TEXT_SUCCESS,
                            message: labels.TEXT_ALARM_DEACTIVATED_SUCCESSFULLY,
                            type: "success"
                        });
                    } catch (error) {
                        if (!signal.aborted) banners.show({
                            title: labels.TEXT_ERROR,
                            message: error.message,
                            type: "error"
                        });
                    }
                }
            }]
        });
    }

    const timers = new Set();

    /****************************************************************************/
    /*!
     * @brief   Schedules a page callback that is cancelled when the page is disposed.
     * @param   callback                Operation to run after the delay.
     * @param   milliseconds            Delay before running the callback.
     * @returns Timer identifier for the scheduled callback.
     */
    /****************************************************************************/
    function delay(callback, milliseconds) {
        /****************************************************************************/
        /*!
         * @brief   Runs a scheduled callback while its page lifecycle is still active.
         */
        /****************************************************************************/
        const timer = setTimeout(() => {
            timers.delete(timer);
            if (!signal.aborted) callback();
        }, milliseconds);
        timers.add(timer);

        return timer;
    }

    /****************************************************************************/
    /*!
     * @brief   Disposes page requests, timers and components when leaving the page.
     * @param   event                   Event reported by the bound control.
     */
    /****************************************************************************/
    window.addEventListener("pagehide", event => {
        if (event.persisted) return;

        events.abort();

        for (const timer of timers) clearTimeout(timer);
        for (const component of components.reverse()) component.destroy();
    }, { signal });

    return { http, popup, banners, components, signal, delay };
}

/****************************************************************************/
/*!
 * @brief   Reads the server-provided JSON configuration for this page.
 * @returns Parsed server-provided page configuration.
 */
/****************************************************************************/
export function readPageData() {
    return JSON.parse(document.getElementById("pageData").textContent);
}
