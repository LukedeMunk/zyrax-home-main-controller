/****************************************************************************/
/*
 * File:    validation.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Validates account and profile input formats.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

export const SYMBOL_CRITICAL_RE = /[$*|~=\[\]#"'<>?,]+/;
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,64}$/;
export const EMAIL_RE = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/;
