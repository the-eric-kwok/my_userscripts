// ==UserScript==
// @name         启信宝增强
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      0.5
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
 * @param {string} companyName Company name which will be copid to clipboard when button clicked
 * @param {string} telephone Telephone number which will be copid to clipboard when button clicked
 * @param {string} address Company address which will be copid to clipboard when button clicked
 * @param {string} senior Senior executive of company which will be copid to clipboard when button clicked
 */
function addBtns(companyName, telephone, address, senior) {
    if (arguments.length < 4) {
        console.error("Arguments of function addBtns not match, should be exactly 4 args.");
        errorAlert("Arguments of function addBtns not match, should be exactly 4 args.")
        return;
    }
    var companyCase;
    if (location.href.includes("qixin.com/publicly"))
        companyCase = 'publicy';
    else if (location.href.includes("qixin.com/company/") && (!document.querySelector(".info-hk")))
        companyCase = 'company';
    else if (document.querySelector(".info-hk"))
        companyCase = 'hk_company';
    else
        companyCase = 'default';
    let _class = {
        'publicy': 'head-tag font-12 inline-block isBlue m-l-10',
        'company': 'head-tag font-12 inline-block isBlue m-l-10',
        'hk_company': 'label label-yellow font-12',
        'default': ''
    };
    let ids = ["copy_com", "copy_tel", "copy_add", "copy_sen"];
    let items = ["公司名称", "电话", "地址", "高管信息"];
    var _btnHtml = (companyCase === 'hk_company') ? "" : "<br>";
    for (var i = 0; i < arguments.length; i++) {
        if (arguments && arguments[i].length > 0) {
            _btnHtml += `<a id="${ids[i]}" class="${_class[companyCase]}">复制${items[i]}</a>`;
        }
    }
    if (document.querySelector(".app-head-basic"))
        document.querySelector(".app-head-basic").querySelector(".claim-tag").insertAdjacentHTML("afterend", _btnHtml);
    else if (document.querySelector(".company-name"))
        document.querySelector(".company-name").insertAdjacentHTML("afterend", _btnHtml);
    else if (document.querySelector(".title"))
        document.querySelector(".title").insertAdjacentHTML("beforeend", _btnHtml)
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i].length > 0) {
            let _args = arguments;
            let _i = i;
            document.getElementById(ids[_i]).onclick = function () {
                copyMe(_args[_i]);
                var originalText = document.getElementById(ids[_i]).innerText;
                document.getElementById(ids[_i]).innerText = "✅复制成功！";
                setTimeout(() => document.getElementById(ids[_i]).innerText = originalText, 1000);
            }
        }
    }
}

/**
 * 生成范围内随机数
 * @param {int} min: 最小值
 * @param {int} max: 最大值
 * @returns `number`
 */
function randBetween(min, max) {
    if (min > max) {
        var tmp = max;
        max = min;
        min = tmp;
    }
    return parseInt(Math.random() * (max - min + 1) + min, 10)
}

/**
 * Shows an alert with a message in specific format when called
 * @param {string} msg Message to be shown in error message
 */
function errorAlert(msg) {
    var loveLetter = [
        "你老公又在写 bug 了！赶紧拍个照告诉他！",
        "脚本出问题啦，拍个照发给老公修复噢～",
        "绝对不是脚本的问题！肯定是启信网更改了页面排版！不管怎么说还是拍个照告诉老公吧～",
    ];
    alert(`${loveLetter[randBetween(0, loveLetter.length - 1)]}\n出问题的网址是：${location.href}\n错误信息：${msg}`);
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
        removeAd(".app-events-dialog-config-modal");
        removeAd(".app-favorite-tip");
        loveUxxx();

        var companyName = "";
        var telephone = "";
        var address = "";
        var senior = "";

        // 替换分隔符
        let delimiter = /[、，。\/\\\.,兼]/g;
        // 需要排除的职位（匹配「其他人员」「xx董事」「董事」「xx委员xx」，但不匹配「董事长」、「董事会」等）
        let job = /其他人员[,\s]|[^,\s]*董事[,\s]|[^,\s]*董事$|[^,\s]*委员[^,\s]*[,\s]?/g;
        // 将职位括号内内容删除
        let quote = /（.*?）|\(.*?\)/g;
        // 删除开头或末尾的分隔符
        let commaAtBeginingOrEnd = /^\s*,|,\s*$/g;

        if (location.href.includes("qixin.com/publicly/") || location.href.includes("qixin.com/company/")) {
            // 从「head」栏中读取
            if (document.querySelector(".phone-valid")) {
                var telElem = document.querySelector(".phone-valid").parentElement.getElementsByClassName("span-info");
                if (telElem.length > 0) {
                    telephone = telElem[0].innerText.trim();
                } else errorAlert("Telephone number inside header not found.");
            } else console.log("HTML class \".phone-valid\" not found")
            if (document.querySelector(".company-name")) {
                companyName = document.querySelector(".company-name").innerText;
                console.log("name: " + companyName);
            } else console.log("HTML class \".company-name\" not found")

            // 从「企业概况」栏中读取
            if (document.getElementById("overview") && !document.getElementById("overview").innerText.includes("暂无信息")) {
                var table = document.getElementById("overview").getElementsByTagName("tbody");
                if (table.length > 0) {
                    var rows = table[0].rows;
                    for (var row of rows) {
                        for (var i = 0; i < row.cells.length; i++) {
                            if (row.cells[i].innerHTML.includes("地址")) {
                                address = (address.length > 0) ? address : row.cells[i + 1].innerText.replace("查看地图", "").replace("附近企业", "").trim();
                            }
                            else if (row.cells[i].innerHTML.includes("企业名称")) {
                                companyName = (companyName.length > 0) ? companyName : row.cells[i + 1].innerText.trim();
                            }
                            else if (row.cells[i].innerHTML.includes("联系电话")) {
                                telephone += (telephone.length == 0 ? "" : ',') + row.cells[i + 1].innerHTML.trim();
                            }
                        }
                    }
                } else errorAlert("Table inside #overview element not found.");
            } else console.log("HTML element id \"overview\" not found or doesn't contain information.");

            // 从「高管信息」栏中读取
            if (document.getElementById("employee") && !document.getElementById("employee").innerText.includes("暂无信息")) {
                table = document.getElementById("employee").getElementsByTagName("tbody");
                if (table.length > 0) {
                    rows = table[0].rows;
                    for (var j = 0; j < rows.length; j++) {
                        let row = rows[j];
                        for (var i = 0, count = 0; i < row.cells.length && count < 4; i++) {
                            if (row.cells[i].innerHTML.includes("姓名")) {
                                var _job = rows[j + 1].cells[i + 1].innerText.trim().replace(/\s/g, "").replace(delimiter, ",").replace(job, "").replace(quote, "").replace(commaAtBeginingOrEnd, "");
                                if (_job.length > 0) {
                                    senior += row.cells[i + 1].innerText.replace("查看简历", "").trim() + ":";
                                    senior += _job;
                                    senior += "、";
                                    count++;
                                }
                            }
                        }
                    }
                    senior = senior.substring(0, senior.length - 1);
                } else errorAlert("Table inside #employee element not found.");
            } else console.log("HTML element id \"employee\" not found or doesn't contain information.");

            // 从「工商信息」栏中读取
            if (document.getElementById("icinfo") && !document.getElementById("icinfo").innerText.includes("暂无信息")) {
                var table = document.getElementById("icinfo").getElementsByTagName("tbody");
                if (table.length > 0) {
                    var rows = table[0].rows;
                    for (var row of rows) {
                        for (var i = 0; i < row.cells.length; i++) {
                            if (row.cells[i].innerHTML.includes("地址")) {
                                address = row.cells[i + 1].innerText.replace("查看地图", "").replace("附近企业", "").trim();
                            }
                            else if (row.cells[i].innerHTML.includes("联系电话")) {
                                telephone += (telephone.length == 0 ? "" : ',') + row.cells[i + 1].innerHTML.trim();
                            }
                        }
                    }
                } else errorAlert("Table inside #icinfo element not found.");
            } else console.log("HTML element id \"icinfo\" not found or doesn't contain information.");

            // 从「主要人员」栏中读取
            if (document.getElementById("employees") && !document.getElementById("employees").innerText.includes("暂无信息")) {
                table = document.getElementById("employees").getElementsByTagName("tbody");
                if (table.length > 0) {
                    var rows = table[0].rows;
                    for (var row of rows) {
                        for (var i = 0; i < row.cells.length; i++) {
                            if (row.cells[i].innerHTML.includes("ent-name")) {
                                var name = row.cells[i].querySelector(".ent-name").querySelector("a");
                                var _job = row.cells[i + 1].innerText.trim().replace(/\s/g, "").replace(delimiter, ",").replace(job, "").replace(quote, "").replace(commaAtBeginingOrEnd, "");
                                if (_job.length > 0) {
                                    senior += name.innerText.trim() + ":";
                                    senior += _job;
                                    senior += "、";
                                }
                            }
                        }
                    }
                    senior = senior.substring(0, senior.length - 1);
                } else errorAlert("Table inside #employees element not found.");
            } else console.log("HTML element id \"employees\" not found or doesn't contain information.");

            // 从「企业概况」栏中读取（香港公司）
            if (document.getElementById("appHkOverview") && !document.getElementById("appHkOverview").innerText.includes("暂无信息")) {
                var table = document.getElementById("appHkOverview").getElementsByTagName("tbody");
                if (table.length > 0) {
                    var rows = table[0].rows;
                    for (var row of rows) {
                        for (var i = 0; i < row.cells.length; i++) {
                            if (row.cells[i].innerHTML.includes("地址")) {
                                address = (address.length > 0) ? address : row.cells[i + 1].innerText.replace("查看地图", "").replace("附近企业", "").trim();
                            }
                            else if (row.cells[i].innerHTML.includes("企业名称")) {
                                companyName = (companyName.length > 0) ? companyName : row.cells[i + 1].innerText.trim();
                            }
                            else if (row.cells[i].innerHTML.includes("联系电话")) {
                                telephone += (telephone.length == 0 ? "" : ',') + row.cells[i + 1].innerHTML.trim();
                            }
                        }
                    }
                } else errorAlert("Table inside #appHkOverview element not found.");
            } else console.log("HTML element id \"icinfo\" not found or doesn't contain information.");

            // 从「高管信息」栏中读取（香港公司）
            if (document.getElementById("hkExecutive") && !document.getElementById("hkExecutive").innerText.includes("暂无信息")) {
                table = document.getElementById("hkExecutive").getElementsByTagName("tbody");
                if (table.length > 0) {
                    rows = table[0].rows;
                    for (var j = 0; j < rows.length; j++) {
                        let row = rows[j];
                        for (var i = 0, count = 0; i < row.cells.length && count < 4; i++) {
                            if (row.cells[i].innerHTML.includes("姓名")) {
                                var _job = rows[j + 1].cells[i + 1].innerText.trim().replace(/\s/g, "").replace(delimiter, ",").replace(job, "").replace(quote, "").replace(commaAtBeginingOrEnd, "");
                                if (_job.length > 0) {
                                    senior += row.cells[i + 1].innerText.replace("查看简历", "").trim() + ":";
                                    senior += _job;
                                    senior += "、";
                                    count++;
                                }
                            }
                        }
                    }
                    senior = senior.substring(0, senior.length - 1);
                } else errorAlert("Table inside #hkExecutive element not found.");
            } else console.log("HTML element id \"employees\" not found or doesn't contain information.");
            addBtns(companyName, telephone, address, senior);
        }
    }, 1000);

})();