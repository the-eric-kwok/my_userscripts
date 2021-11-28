// ==UserScript==
// @name         U校园英语网课答案显示
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      1.2
// @description  小窗口显示U校园板块测试答案
// @author       gongchen, EricKwok
// @icon         https://ucontent.unipus.cn/favicon.ico
// @match        *://ucontent.unipus.cn/_pc_default/pc.html?*
// @match        *://u.unipus.cn/*
// @connect      unipus.cn
// @connect      caiyunai.com
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @require      https://lib.baomitu.com/jquery/3.6.0/jquery.min.js
// @License      GPLv3
// ==/UserScript==

/**
 * Generate a random string
 * @param {number} length Length of this random string
 * @returns {string} The random string
 */
function randomString(length) {
    let abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let ret = "";
    for (let i = 0; i < length; i++) {
        ret += abc.charAt(Math.floor(Math.random() * abc.length));
    }
    return ret
}

/**
 * 异步等待，只阻塞当前脚本调用处函数，不阻塞整个浏览器，默认等待 10 ms
 *
 * 调用方法：await sleep() 或 await sleep (1000)
 *
 * @param {number} ms 等待的毫秒数
 * @returns 一个匿名函数的 Promise
 */
function sleep(ms = 10) {
    // 异步等待，只阻塞当前脚本调用处函数，不阻塞整个浏览器
    // 调用方法：await sleep() 或 await sleep (1000)
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            resolve();
        }, ms);
    })
}

/**
 * Copy a string to clipboard
 * @param {string} str String to be copy
 */
function copyMe(str) {
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
            })
    } else {
        _legacyCopy();
    }
}

function main() {
    if (window.location.href.includes("u.unipus.cn")) {
        window.setInterval(function () {
            if (document.getElementsByClassName("layui-layer-shade").length > 0) {
                // 去除环境检测弹窗
                document.querySelector(".layui-layer-shade").remove();
            }
        }, 100);
    }
    if (window.location.href.includes("ucontent.unipus.cn")) {
        $('head').append('<link href="https://lib.baomitu.com/layui/2.6.8/css/layui.css" rel="stylesheet" type="text/css" />');
        $.getScript("https://lib.baomitu.com/layui/2.6.8/layui.js", function (data, status, jqxhr) {
            layui.use('element', function () {
                let element = layui.element;
            });
            layer.closeAll();
            show();
            showanswer();
        });

        window.setInterval(function () {
            if (document.getElementsByClassName("dialog-header-pc--close-yD7oN").length > 0) {
                // 关闭单元学习时间弹窗
                document.querySelector(".dialog-header-pc--close-yD7oN").click();
            }
        }, 100);

        let show = () => {
            layer.open({
                type: 1,
                area: ['310px', '400px'],
                offset: 'r',
                id: 'msgt',
                closeBtn: 1,
                title: " ",
                shade: 0,
                maxmin: true,
                anim: 2,
                content: `<div class="layui-collapse"><div class="layui-colla-item"></div></div>
                <div id="content">
                    <table class="layui-table">
                        <colgroup>
                            <col width="100">
                            <col>
                            <col>
                        </colgroup>
                        <thead><tr></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>`
            });
        }

        let showanswer = () => {
            let url = location.href
            let arr = url.split("/")
            let unit = arr[arr.length - 2]
            let course = /course-v1:.*?\//g.exec(url);
            course = course[0];
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://ucontent.unipus.cn/course/api/content/' + course + unit + '/default/',
                headers: {
                    'X-ANNOTATOR-AUTH-TOKEN': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJvcGVuX2lkIjoidHV4NkNCQVc4aGRrcnFZdzc5SEpEWDF2aTR5Z2ptcDUiLCJuYW1lIjoiIiwiZW1haWwiOiIiLCJhZG1pbmlzdHJhdG9yIjoiZmFsc2UiLCJleHAiOjE5MDI5NzAxNTcwMDAsImlzcyI6IlI0aG03RmxQOFdvS0xaMUNmTkllIiwiYXVkIjoiZWR4LnVuaXB1cy5jbiJ9.CwuQmnSmIuts3hHAMf9lT954rKHXUNkps-PfRJp0KnU'
                },
                timeout: 5000,
                onload: function (xhr) {
                    if (xhr.status == 200) {
                        let obj = JSON.parse(xhr.responseText) || {};
                        if (obj.content) {
                            let content = JSON.parse(obj.content) || {};
                            // 选择题
                            if (content["questions:questions"]) {
                                let questionList = content['questions:questions']['questions'];
                                let num = 0;
                                for (let question of questionList) {
                                    num++;
                                    let answerId = randomString(5);
                                    let btnId = randomString(5);
                                    let el = `<tr class="layui-bg"><td><b>${num}. </b><code id="${answerId}">${question.answers.join("、")}</code></td></tr>`;
                                    $("#content>table>tbody").append($(el));
                                    $(`#${btnId}`).on("click", function () {
                                        let _answer = $(`#${answerId}`).text();
                                        copyMe(_answer);
                                    })
                                }
                                let interval = window.setInterval(async function () {
                                    if (document.querySelector(".questions--questionDefault-2XLzl.undefined")) {
                                        window.clearInterval(interval);
                                        let num = 0;
                                        for (let question of questionList) {
                                            let questionElem = document.querySelectorAll(".questions--questionDefault-2XLzl.undefined")[num]
                                            let options = questionElem.querySelectorAll(".clearfix");
                                            for (let answer of question.answers) {
                                                let sel = answer.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
                                                options[sel].click();
                                            }
                                            num++;
                                            await sleep(1000);
                                        }
                                    }
                                }, 1000);
                            }

                            // 填空题
                            if (content['questions:scoopquestions']) {
                                let questionList = content['questions:scoopquestions']['questions'];
                                let num = 0;
                                for (let question of questionList) {
                                    num++;
                                    let answerId = randomString(5);
                                    let btnId = randomString(5);
                                    let el = `<tr class="layui-bg"><td><b>${num}. </b><code id="${answerId}">${question.answers[0]}</code><button style="float:right;" id="${btnId}">复制</button></td></tr>`;
                                    $("#content>table>tbody").append($(el));
                                    $(`#${btnId}`).on("click", function () {
                                        let _answer = $(`#${answerId}`).text();
                                        copyMe(_answer);
                                    });
                                }

                            }

                            // 翻译题
                            if (content['shortanswer:shortanswer']) {
                                let question = content['shortanswer:shortanswer'].content[0].html.html;
                                question = question.replace(/<.*?>|\(.*?\)|（.*?）/g, "");
                                let direction = 'zh2en';
                                if (/^[a-zA-Z\.,\s]+$/g.test(question.substring(0, 5))) direction = 'en2zh';
                                GM_xmlhttpRequest({
                                    method: "POST",
                                    url: "http://api.interpreter.caiyunai.com/v1/translator",
                                    data: `{
                                        "source":"${question}",
                                        "trans_type":"${direction}",
                                        "request_id":"${randomString(5)}",
                                        "detect":true
                                    }`,
                                    headers: {
                                        "content-type": "application/json",
                                        "x-authorization": "token 3975l6lr5pcbvidl6jl2"
                                    },
                                    onload: function (response) {
                                        if (response.status == 200) {
                                            let respJson = JSON.parse(response.responseText);
                                            console.log(respJson.target);
                                            let btnId = randomString(5);
                                            let el = `<tr class="layui-bg"><td><b>彩云小译：</b>${respJson.target}<button style="float:right;" id="${btnId}">复制</button></td></tr>`;
                                            $("#content>table>tbody").prepend($(el));
                                            $(`#${btnId}`).on("click", function () {
                                                copyMe(respJson.target);
                                            })
                                        } else {
                                            let el = `<tr class="layui-bg"><td>彩云小译：获取失败，请刷新重试</td></tr>`;
                                            $("#content>table>tbody").prepend($(el));
                                        }
                                    },
                                    onerror: function () {
                                        let el = `<tr class="layui-bg"><td>彩云小译：获取失败，请刷新重试</td></tr>`;
                                        $("#content>table>tbody").prepend($(el));
                                    },
                                    onabort: function () {
                                        let el = `<tr class="layui-bg"><td>彩云小译：获取失败，请刷新重试</td></tr>`;
                                        $("#content>table>tbody").prepend($(el));
                                    },
                                    ontimeout: function () {
                                        let el = `<tr class="layui-bg"><td>彩云小译：获取失败，请刷新重试</td></tr>`;
                                        $("#content>table>tbody").prepend($(el));
                                    },
                                    timeout: 5000
                                });
                                let answer = content['shortanswer:shortanswer'].analysis.html;
                                answer = answer.replace(/<.*?>/g, "");
                                let el = `
                                <tr class="layui-bg"><td><b>标准答案（仅供参考）：</b>${answer}</td></tr>`;
                                $("#content>table>tbody").append($(el));
                            }

                            // 简答题
                            if (content["questions:shortanswer"]) {
                                let questionList = content["questions:shortanswer"]["questions"];
                                let num = 0;
                                for (let question of questionList) {
                                    num++;
                                    let answer = question.analysis.html.replace(/<.*?>/g, "").replace(/\d\.\s?(&nbsp;)?/g, "");
                                    let answerId = randomString(5);
                                    let btnId = randomString(5);
                                    let el = `<tr class="layui-bg"><td><b>${num}.（仅供参考）</b><code id="${answerId}">${answer}</code><button style="float:right;" id="${btnId}">复制</button></td></tr>`;
                                    $("#content>table>tbody").append($(el));
                                    $(`#${btnId}`).on("click", function () {
                                        let _answer = $(`#${answerId}`).text();
                                        copyMe(_answer);
                                    });

                                }
                            }
                        }
                    } else {
                        let el = `<tr class="layui-bg"><td>答案加载失败，请刷新重试。</td></tr>`;
                        $("#content>table>tbody").append($(el));
                    }
                },
                onerror: function () {
                    let el = `<tr class="layui-bg"><td>答案加载失败，请刷新重试。</td></tr>`;
                    $("#content>table>tbody").append($(el));
                },
                onabort: function () {
                    let el = `<tr class="layui-bg"><td>答案加载失败，请刷新重试。</td></tr>`;
                    $("#content>table>tbody").append($(el));
                },
                ontimeout: function () {
                    let el = `<tr class="layui-bg"><td>答案加载失败，请刷新重试。</td></tr>`;
                    $("#content>table>tbody").append($(el));
                },
            });
        }

        window.onhashchange = () => {
            $("#content>table>tbody").empty();
            showanswer();
        }
    }
}

(function () {
    'use strict';
    window.addEventListener('pjax:success', function () {
        // 将 main 函数绑定到 pjax 监听器上
        console.log("pjax success");
        main();
    });
    window.addEventListener('pushState', function (e) {
        console.log('change pushState');
        main();
    });
    window.addEventListener('replaceState', function (e) {
        console.log('change replaceState');
        main();
    });
    window.addEventListener('hashchange', function (event) {
        console.log(event, 'hashchange');
        //main();
    })
    main();
})();