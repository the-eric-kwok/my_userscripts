// ==UserScript==
// @name         国际版B站跳转回中国版
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      0.1
// @description  外国搜索引擎（如Google）上抓取到的B站视频链接为国际版，不展示评论区等内容，使用此脚本将为你自动跳转回国内版本的B站
// @author       EricKwok
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// @match        *://www.bilibili.com/s/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @run-at       document-start
// @license      GPLv3
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let re = /video\/(.*)/g;
    let result = re.exec(window.location.href);
    var videoId;
    if (result.length > 1) {
        videoId = result[1];
        window.location.replace(`https://www.bilibili.com/video/${videoId}`);
    }
})();