// ==UserScript==
// @name         别打扰我复制粘贴
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      0.2
// @description  阻止网站在你复制内容时弹出弹框或阻止复制
// @include      *
// @author       EricKwok
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// @icon         https://s2.loli.net/2021/12/08/liKEwk6tF4a7XbL.png
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    window.addEventListener("copy", function (event) {
        event.stopImmediatePropagation();
    }, true);
})();