// ==UserScript==
// @name         [R.I.P]智慧树助手（已失效）
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      99.99.99
// @description  目前脚本已经没有任何作用。由于浏览器JavaScript的限制，所有通过JavaScript触发的点击事件都是不被信任的，智慧树便是通过这个方法检测是否使用了用户脚本的，此限制无法绕过，也就无法解决脚本检测的问题。此外在考试和作业页面中，智慧树很鸡贼地将题目内容放到了一个关闭的shadow root中，JavaScript无法访问、读取题目内容，因此无法复制和查题了。此限制同样无法绕过。如有需要可以找一下是否有配合Selenium自动化的刷课工具吧，各位再见，前程多保重！
// @author       EricKwok, C选项_沉默
// @homepage     https://github.com/the-eric-kwok/my_userscripts
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// @match        *://*.zhihuishu.com/*
// @run-at       document-start
// @icon         https://assets.zhihuishu.com/icon/favicon.ico?v=20210605
// @license      GPLv3
// ==/UserScript==


(function () {
    'use strict';

    alert(`目前脚本已经没有任何作用。
由于浏览器JavaScript的限制，所有通过JavaScript触发的点击事件都是不被信任的，智慧树便是通过这个方法检测是否使用了用户脚本的，此限制无法绕过，也就无法解决脚本检测的问题。
此外在考试和作业页面中，智慧树很鸡贼地将题目内容放到了一个关闭的shadow root中，JavaScript无法访问、读取题目内容，因此无法复制和查题了。此限制同样无法绕过。
如有需要可以找一下是否有配合Selenium自动化的刷课工具吧，各位再见，前程多保重！`);

})();

