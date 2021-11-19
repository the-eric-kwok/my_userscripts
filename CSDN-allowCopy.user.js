// ==UserScript==
// @name         CSDN 允许复制、去广告
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      0.2
// @description  将“登录以复制”按钮更改为复制功能，去除 banner 广告
// @author       EricKwok
// @match        https://*.csdn.net/*
// @icon         https://g.csdnimg.cn/static/logo/favicon32.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';
    function addListener(element, eventName, handler) {
        if (element.addEventListener) {
            element.addEventListener(eventName, handler, false);
        }
        else if (element.attachEvent) {
            element.attachEvent('on' + eventName, handler);
        }
        else {
            element['on' + eventName] = handler;
        }
    }
    function copyMe(elem) {
        console.log(elem);
        elem.path[0].setAttribute("data-title", "复制成功✅")
        window.setTimeout(() => elem.path[0].setAttribute("data-title", "复制"), 1000);
        let code = elem.path[1].innerText;
        function _legacyCopy() {
            console.log("正在使用传统方法复制");
            let tmpInput = document.createElement('input');
            elem.insertAdjacentHTML("afterend", tmpInput)
            tmpInput.value = code;
            tmpInput.focus();
            tmpInput.select();
            if (document.execCommand('copy')) {
                document.execCommand('copy');
            }
            tmpInput.blur();
            console.log('复制成功');
            tmpInput.remove();

        }

        if (navigator.clipboard && window.isSecureContext) {
            console.log("正在使用 navigator clipboard api 进行复制操作");
            navigator.clipboard.writeText(code)
                .then(() => {
                    console.log('复制成功');
                })
                .catch(err => {
                    console.log("navigator clipboard api 复制时出错，将使用传统方法进行复制")
                    _legacyCopy();
                })
        } else {
            _legacyCopy();
        }
    }

    function makeCopy() {
        for (var item of document.querySelectorAll("pre")) {
            for (var child of item.children) {
                if (child.className.includes("signin")) {
                    child.setAttribute("data-title", "复制");
                    child.setAttribute("onclick", "");
                    addListener(child, 'click', function (child) {
                        copyMe(child);
                    });
                }
                for (var child2 of child.children) {
                    if (child2.className.includes("signin")) {
                        child2.setAttribute("data-title", "复制");
                        child.setAttribute("onclick", "");
                        addListener(child2, 'click', function (child) {
                            copyMe(child);
                        });
                    }
                }
            }
        }
    }

    if (window.location.href.includes("blog.csdn.net")) {
        window.onload = function () {
            makeCopy();
            for (var elem of document.querySelectorAll(".toolbar-advert")) {
                elem.remove();
            }
        };
    }
})();
