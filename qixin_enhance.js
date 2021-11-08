// ==UserScript==
// @name         启信宝增强
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      0.1
// @description  老婆专用的启信宝增强插件
// @author       最爱你的老公
// @match        https://*.qixin.com/*
// @icon         https://www.qixin.com/favicon.ico
// @run-at       document-end
// @grant        none
// ==/UserScript==

/**
 * Auto remove on-page advertisement
 * @param {string} selector CSS selector of AD the root node of AD content
 */
function removeAd(selector) {
    window.setInterval(function () {
        if (document.querySelectorAll(selector).length > 0) {
            for (var ad of document.querySelectorAll(selector)) {
                ad.parentNode.removeChild(ad);
                ad.remove();
            }
        }
    }, 100);
}

/**
 * Copy a string to system clipboard
 * @param {string} str String to be copied
 */
function copyMe(str) {
    /**
     * Copy to clipboard in legacy(old) way, this is a fallback option, in order to be compatible with old browser like IE.
     */
    function _legacyCopy() {
        console.log("正在使用传统方法复制");
        let tmpInput = document.createElement('input');
        elem.insertAdjacentHTML("afterend", tmpInput)
        tmpInput.value = str;
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
        navigator.clipboard.writeText(str)
            .then(() => {
                console.log('复制成功');
            })
            .catch(err => {
                console.log("navigator clipboard api 复制时出错，将使用传统方法进行复制")
                _legacyCopy();
            });
    } else {
        _legacyCopy();
    }
}

/**
 * Add copy info button to page.
 * @param {string} telephone Telephone number which will be copid to clipboard when button clicked
 * @param {string} address Company address which will be copid to clipboard when button clicked
 * @param {string} senior Senior executive of company which will be copid to clipboard when button clicked
 */
function addBtns(telephone, address, senior) {
    let title = document.querySelector(".app-head-basic");
    let pos = title.querySelector(".claim-tag");
    if (pos) pos.insertAdjacentHTML("afterend", "&nbsp;&nbsp;<a id=\"copy_tel\">复制电话</a>&nbsp;&nbsp;<a id=\"copy_add\">复制地址</a>&nbsp;&nbsp;<a id=\"copy_sen\">复制高管信息</a>");
    else document.querySelector(".company-name").insertAdjacentHTML("afterend", "&nbsp;&nbsp;<a id=\"copy_tel\">复制电话</a>&nbsp;&nbsp;<a id=\"copy_add\">复制地址</a>&nbsp;&nbsp;<a id=\"copy_sen\">复制高管信息</a>");
    document.getElementById("copy_tel").onclick = function () {
        copyMe(telephone);
    }
    document.getElementById("copy_add").onclick = function () {
        copyMe(address);
    }
    document.getElementById("copy_sen").onclick = function () {
        copyMe(senior);
    }
}

/**
 * Shows an alert with a message in specific format when called
 * @param {string} msg Message to be shown in error message
 */
function errorAlert(msg) {
    alert(`脚本出问题啦，拍个照发给老公修复噢～\n出问题的网址是：${location.href}\n错误信息：${msg}`);
}

function loveUxxx() {
    // Change avator
    if (document.querySelectorAll("img.avator").length > 0) {
        for (var avator of document.querySelectorAll("img.avator")) {
            avator.src = "https://i.loli.net/2021/11/08/dfo6OqKGVjRgwzB.gif";
        }
    }
    if (location.href.includes("qixin.com/user/home/center")) {
        if (document.querySelectorAll(".has-img").length > 0) {
            for (var avatar of document.querySelectorAll(".has-img")[0].children) {
                avatar.src = "https://i.loli.net/2021/11/08/dfo6OqKGVjRgwzB.gif";
            }
        }
    }
}

(function () {
    'use strict';
    window.onload = window.setTimeout(function () {
        removeAd(".app-corner-marker");
        removeAd(".web-diversion-container");
        removeAd(".app-web-diversion-default");
        removeAd(".fixed-tool");
        removeAd(".app-home-carousel");
        removeAd(".footer-top");
        loveUxxx();

        if (location.href.includes("qixin.com/ publicly")) {
            var telephone = "";
            var address = "";
            var senior = "";

            var telElem = document.querySelector(".phone-valid").parentElement.getElementsByClassName("span-info");
            if (telElem.length > 0) {
                telephone = telElem[0].innerText.trim();
            } else errorAlert("Telephone number inside header not found.");

            var table = document.getElementById("overview").getElementsByTagName("tbody");
            if (table.length > 0) {
                var rows = table[0].rows;
                for (var row of rows) {
                    for (var i = 0; i < row.cells.length; i++) {
                        if (row.cells[i].innerHTML.includes("联系电话")) {
                            telephone += ',' + row.cells[i + 1].innerHTML.trim();
                        }
                        if (row.cells[i].innerHTML.includes("地址")) {
                            address = row.cells[i + 1].innerHTML.trim();
                        }
                    }
                }
            } else errorAlert("Table inside #overview element not found.");

            table = document.getElementById("employee").getElementsByTagName("tbody");
            if (table.length > 0) {
                rows = table[0].rows;
                for (var j = 0; j < rows.length; j++) {
                    let row = rows[j];
                    for (var i = 0, count = 0; i < row.cells.length && count < 4; i++) {
                        if (row.cells[i].innerHTML.includes("姓名")) {
                            senior += row.cells[i + 1].innerText.replace("查看简历", "").trim() + ":";
                            senior += rows[j + 1].cells[i + 1].innerText.trim().replace(/[、，。.,]/g, ",");
                            senior += "、";
                            count++;
                        }
                    }
                }
                senior = senior.substring(0, senior.length - 1);
            } else errorAlert("Table inside #employee element not found.");
            console.log("Senior executive: " + senior);
            addBtns(telephone, address, senior);
        }
        else if (location.href.includes("qixin.com/company/")) {
            var telephone = "";
            var address = "";
            var senior = "";

            // 从「企业主页」栏中读取
            var telElem = document.querySelector(".phone-valid").parentElement.getElementsByClassName("span-info");
            if (telElem.length > 0) {
                telephone = telElem[0].innerText.trim();
            } else errorAlert("Telephone number inside header not found.");

            // 从「工商信息」栏中读取
            var table = document.getElementById("icinfo").getElementsByTagName("tbody");
            if (table.length > 0) {
                var rows = table[0].rows;
                for (var row of rows) {
                    for (var i = 0; i < row.cells.length; i++) {
                        if (row.cells[i].innerHTML.includes("地址")) {
                            address = row.cells[i + 1].innerText.replace("查看地图", "").replace("附近企业", "").trim();
                        }
                        else if (row.cells[i].innerHTML.includes("联系电话")) {
                            telephone += ',' + row.cells[i + 1].innerHTML.trim();
                        }
                    }
                }
            } else errorAlert("Table inside #icinfo element not found.");

            // 从「主要人员」栏中读取
            table = document.getElementById("employees").getElementsByTagName("tbody");
            if (table.length > 0) {
                var rows = table[0].rows;
                for (var row of rows) {
                    for (var i = 0; i < row.cells.length; i++) {
                        if (row.cells[i].innerHTML.includes("ent-name")) {
                            var name = row.cells[i].querySelector(".ent-name").querySelector("a");
                            senior += name.innerText.trim() + ":";
                            senior += row.cells[i + 1].innerText.trim().replace(/[、，。.,]/g, ",");
                            senior += "、";
                        }
                    }
                }
                senior = senior.substring(0, senior.length - 1);
            } else errorAlert("Table inside #employees element not found.");
            addBtns(telephone, address, senior);

        }

    }, 1000);

})();