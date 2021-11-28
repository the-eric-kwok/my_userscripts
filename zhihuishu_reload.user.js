// ==UserScript==
// @name         [Reload]智慧树考试搜题、共享课挂机刷课助手
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @version      1.3.0
// @description  智慧树共享课刷课、跳过弹题、自动换集、自动1.5倍速、自动静音、自动标清、自动搜题、解除考试复制封印及一键复制题目到剪贴板
// @author       EricKwok, C选项_沉默
// @homepage     https://github.com/the-eric-kwok/my_userscripts
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// @match        *://studyh5.zhihuishu.com/videoStudy*
// @match        *://onlineexamh5new.zhihuishu.com/stuExamWeb.html*
// @connect      *://cx.icodef.com/*
// @connect      *://api.zhizhuoshuma.cn/*
// @connect      *://api.muketool.com/*
// @require      https://greasyfork.org/scripts/28536-gm-config/code/GM_config.js
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @run-at       document-end
// @icon         https://assets.zhihuishu.com/icon/favicon.ico?v=20210605
// @license      GPLv3
// ==/UserScript==

let queryLock = false;

let gxkEnable = true;
let copyEnable = true;
let autoCopyEnable = true;
let autoFindAnswer = true;
let abnormalStuckDetectionEnable = true;
let abnormalStuckDetectionLimit = 10;
let autoClosePopUpTest = true;
let pauseResume = true;
let autoMute = true;
let auto15x = true;
let autoBQ = true;
let autoPlayNext = true;
let autoStop = false;
let autoStopTime = 30;

let timeInterval = 1;  // 脚本主循环时间间隔

let stuckCount = 0;  // 卡顿计数
let lastProgressBar = '';  // 进度条缓存
let startTime = new Date().getTime();

let myConfigState = false;
let myConfig = {
    'id': 'MyConfig',  // The id used for this instance of GM_config
    'title': '智慧树助手 - 设置',  // Panel Title
    'fields': {
        'gxkEnable': {
            'label': '在共享课上启用脚本',
            'type': 'checkbox',
            'default': true
        },
        'copyEnable': {
            'label': '在章节测试/考试中解除复制封印',
            'type': 'checkbox',
            'default': true
        },
        'autoCopyEnable': {
            'label': '在章节测试/考试中点击题目自动复制',
            'type': 'checkbox',
            'default': true
        },
        'autoFindAnswer': {
            'label': '在章节测试/考试中自动搜索答案',
            'type': 'checkbox',
            'default': true
        },
        'abnormalStuckDetectionEnable': {
            'label': '异常卡顿自动刷新',
            'type': 'checkbox',
            'default': true
        },
        'abnormalStuckDetectionLimit': {
            'label': '异常卡顿超时时长（秒）',
            'type': 'int',
            'default': 10
        },
        'autoClosePopUpTest': {
            'label': '自动关闭课程中的弹题测验',
            'type': 'checkbox',
            'default': true
        },
        'pauseResume': {
            'label': '暂停自动恢复播放',
            'type': 'checkbox',
            'default': true
        },
        'autoMute': {
            'label': '自动静音',
            'type': 'checkbox',
            'default': true
        },
        'auto15x': {
            'label': '自动切换1.5倍速',
            'type': 'checkbox',
            'default': true
        },
        'autoBQ': {
            'label': '自动切换标清',
            'type': 'checkbox',
            'default': true
        },
        'autoPlayNext': {
            'label': '自动播放下一集',
            'type': 'checkbox',
            'default': true
        },
        'autoStop': {
            'label': '自动停止播放',
            'type': 'checkbox',
            'default': false
        },
        'autoStopTime': {
            'label': '多少分钟后停止播放',
            'type': 'int',
            'default': '30'
        }
    },
    'events': {
        'save': function () {
            GM_config.close();
            log("配置已保存");
            showDialog("配置已保存，刷新页面生效", 1, true, true);
        },
        'open': function (doc) {
            // 翻译按钮文本
            let config = this;
            doc.getElementById(config.id + '_saveBtn').textContent = "确定";
            doc.getElementById(config.id + '_closeBtn').textContent = "取消";
            doc.getElementById(config.id + '_resetLink').textContent = "重置";
            // 更改设置页面的宽度为屏幕的50%
            $('iframe#' + config.id).css({
                'width': '400px',
                'left': (document.body.clientWidth - 450) + 'px',
                'height': '450px',
                'top': '80px',
                'box-shadow': '0px 0px 15px grey',
                'border': '0px',
                'border-radius': '5px',
                'background': '#F9F9F9',
            });
            myConfigState = true;
        },
        'close': function () {
            myConfigState = false;
        }
    },
    'css': [
        '#MyConfig { background: #F9F9F9; }',
        '#MyConfig .saveclose_buttons { font-size: 14px; background: #3d84ff; border-radius: 14px; line-height: 24px; width: 82px; height: 28px; color: #FFF; border: none; cursor: pointer; }',
        '#MyConfig .field_label { font-size: 14px; font-weight: bold; margin-right: 6px; }',
        '#MyConfig .radio_label { font-size: 14px; }',
        "#MyConfig .config_header { margin: 20px; }",
        '#MyConfig_buttons_holder { color: #000; text-align: right; margin-top: 75px; }',
        '#MyConfig_wrapper { padding: 0 20px }',
    ].join('\n') + '\n'
}

/**
 * 在浏览器窗口大小改变时自动重新定位设置菜单
 */
window.onresize = function () {
    // 监听窗口大小改变
    if ($("iframe#MyConfig").css('left') !== undefined) {
        $("iframe#MyConfig").css('left', (document.body.clientWidth - 450) + 'px');
    }
}

/**
 * 获取浏览器名称
 * @returns 浏览器名称（如 "Safari"）
 */
function explorerDetect() {
    if (navigator.userAgent.indexOf("Opera") > -1) {
        return 'Opera';
    }
    else if (navigator.userAgent.indexOf("Firefox") > -1) {
        return 'Firefox';
    }
    else if (navigator.userAgent.indexOf("Chrome") > -1) {
        return 'Chrome';
    }
    else if (navigator.userAgent.indexOf("Safari") > -1) {
        return 'Safari';
    }
    else if (navigator.userAgent.indexOf("compatible") > -1 && navigator.userAgent.indexOf("MSIE") > -1 && !(navigator.userAgent.indexOf("Opera") > -1)) {
        return "IE";
    }
}

/**
 * 获取 GM_config 中存储的用户自定义设置
 */
function init() {
    gxkEnable = GM_config.get("gxkEnable");
    copyEnable = GM_config.get("copyEnable");
    autoCopyEnable = GM_config.get("autoCopyEnable");
    autoFindAnswer = GM_config.get("autoFindAnswer");
    abnormalStuckDetectionEnable = GM_config.get("abnormalStuckDetectionEnable");
    abnormalStuckDetectionLimit = GM_config.get("abnormalStuckDetectionLimit");
    autoClosePopUpTest = GM_config.get("autoClosePopUpTest");
    pauseResume = GM_config.get("pauseResume");
    autoMute = GM_config.get("autoMute");
    auto15x = GM_config.get("auto15x");
    autoBQ = GM_config.get("autoBQ");
    autoPlayNext = GM_config.get("autoPlayNext");
    autoStop = GM_config.get("autoStop");
    autoStopTime = GM_config.get("autoStopTime");
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
 * 获取当前时间
 * @returns 当前时间，格式化为：[MM/dd HH:mm:ss]
 */
function dateTime() {
    let t = new Date();
    return '[' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds() + '] ';
}

/**
 * 自定义的控制台 log 方法
 * @param {String} message 日志内容
 */
function log(message) {
    console.log(dateTime() + '[智慧树助手] ' + message);
}

/**
 * 自定义的控制台 log error 方法
 * @param {String} message 日志内容
 */
function logError(message) {
    console.error(dateTime() + '[智慧树助手] ' + message);
}

/**
 * 获取未观看列表
 * @returns 未观看的网课列表
 */
function getNotPlayed() {
    let video_labels = [];
    let list = $('.clearfix.video');
    if (list.length > 0) {
        list.each(function (index, elem) {
            if ($(elem).find('.time_icofinish').length < 1) {
                if (!$(elem).hasClass('current_play')) {
                    video_labels.push(elem);
                }
            }
        });
    }
    console.log(
        "更新未看列表，还剩" + video_labels.length + "个视频未完成\n",
        { "点击展开全部": video_labels }
    );
    return video_labels;
}

/**
 * 切换1.5倍速
 */
function autoSwitch15x() {
    if ($("video").length > 0 && $("video")[0].playbackRate != 1.5 && auto15x) {
        log('切换到1.5倍');
        if ($(".speedTab15").length > 0) {
            $(".speedTab15")[0].click();
        }
        if ($(".speedTab.speedTab15").length > 0) {
            $(".speedTab.speedTab15")[0].click();
        }
    }
}

/**
 * 切换标清
 */
function autoSwitchBQ() {
    if ($(".definiLines .active").length > 0) {
        if ($(".definiLines .active")[0].className === "line1gq switchLine active" && autoBQ &&
            $(".line1bq.switchLine").length > 0) {
            log('切换到标清');
            $(".line1bq.switchLine")[0].click();
        }
    }
}

/**
 * 切换静音
 */
function autoSwitchMute() {
    if ($("video").length > 0) {
        if ($("video")[0].volume > 0 && autoMute && $(".volumeIcon").length > 0) {
            log('自动静音');
            $(".volumeIcon")[0].click();
        }
    }
}

/**
 * 关闭页面加载后的一些“烦人的”弹窗
 */
function closeTips() {
    if ($('.dialog[style!="display: none;"]:has(.dialog-read)').length > 0
        && $('.iconguanbi').length > 0) {
        log("学前必读已关闭");
        $('.iconguanbi').click();
    }

    if ($('.dialog-warn').css('display') !== 'none'
        && $('.el-icon-close').length > 0) {
        console.log('智慧树警告已关闭', $('.el-icon-close'));
        $('.el-icon-close').click();
    }

    if ($('#close_windowa').length > 0) {
        log("已关闭提示弹窗");
        $('#close_windowa')[0].click();
    }
}

/**
 * 关闭弹题测验
 */
async function closePopUpTest() {
    let pop_up = $('.dialog-test');
    if (pop_up.length > 0 && autoClosePopUpTest) {
        //关闭出现的检测题
        let topic_item = $('.topic-item');
        let guess_answer = parseInt(Math.random() * topic_item.length);
        topic_item[guess_answer].click();
        await sleep(1000);
        let guess_char = 'ABCD'[guess_answer];
        //随机点击一个选项
        let answer = $('.answer').children().text();
        //选出正确答案
        if (answer.indexOf('A') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[0].click();
        }
        else if (answer.indexOf('B') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[1].click();
        }
        else if (answer.indexOf('C') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[2].click();
        }
        else if (answer.indexOf('D') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[3].click();
        }
        await sleep(1000);
        pop_up.find('div.btn').click();
        log(
            "为您跳过弹题测验，" +
            ((answer === guess_char) ? ("一次蒙对，答案：" + answer) : ("蒙的" + guess_char + '，正确答案：' + answer))
        );
    }
}

/**
 * 检测是否播放完成
 */
function progressBarMonitor() {
    let progress_bar = $('.nPlayTime');
    //监控进度条
    if (progress_bar.length > 0 && progress_bar.children().length > 0 && autoPlayNext) {
        let ProgressBar = progress_bar.children('.currentTime').text();
        // 跳集条件：
        // 1. 剩余时间不为 00:00:00 （即视频已成功加载）
        // 2. 已播放时间与剩余时间相等（即视频已播放完毕）
        // 3. 右侧目录中正在播放的栏目需要有 time_icofinish 图标（即系统已记录下视频播放完成）
        // 若以上三个条件中任意一个不满足则不跳集，而是回到视频开头重新开始（或由 stuckDetector() 函数刷新页面）
        if ((ProgressBar !== '00:00:00') && (ProgressBar === progress_bar.children('.duration').text() &&
            ($('.current_play').find('.time_icofinish').length > 0))) {
            log("检测到进度条已满");
            let next_video = null;
            if (window.location.href.indexOf("studyh5.zhihuishu.com") !== -1) {
                next_video = $(getNotPlayed()[0]);
            }
            log("已为您自动切换下一集");
            next_video.click();
        }
    }
}

/**
 * 暂停检测
 */
function pauseDetector() {
    let play_Button = $(".playButton");
    if (play_Button.length > 0 && pauseResume) {
        //点击暂停按钮，将继续播放视频
        play_Button.click();
        log("继续播放");
    }
}

/**
 * 卡顿检测
 */
function stuckDetector() {
    if (abnormalStuckDetectionEnable) {
        let progress_bar = $('.nPlayTime');
        if (progress_bar.length > 0) {
            // 播放器正常加载的情况
            let ProgressBar = progress_bar.children('.currentTime').text();
            if ($("video").length > 0 && progress_bar.children().length > 0 &&
                abnormalStuckDetectionLimit > 0 && pauseResume) {
                if (ProgressBar !== lastProgressBar) {
                    if (stuckCount !== 0) {
                        log("已恢复播放，取消页面刷新计划");
                    }
                    stuckCount = 0;
                }
                else {
                    if (stuckCount >= abnormalStuckDetectionLimit) {
                        stuckCount = 0;
                        location.reload();
                    }
                    else {
                        stuckCount++;
                        log("即将刷新页面…… " + stuckCount + "/" + abnormalStuckDetectionLimit);
                    }
                }
                lastProgressBar = ProgressBar;
            }
        } else {
            // 播放器未正常加载的情况
            if (stuckCount >= abnormalStuckDetectionLimit) {
                stuckCount = 0;
                location.reload();
            } else {
                stuckCount++;
                log("即将刷新页面…… " + stuckCount + "/" + abnormalStuckDetectionLimit);
            }
        }
    }
}

/**
 * 强制允许复制
 */
function copyEnabler() {
    log('强制复制');
    function hackItem(item) {
        item.onpaste = () => true;
        item.oncontextmenu = () => true;
        item.onselectstart = () => true;
        item.ondragstart = () => true;
        item.oncopy = () => true;
        item.onbeforecopy = () => true;
        Object.defineProperty(item, 'onpaste', { get: () => false, set: () => null })
        Object.defineProperty(item, 'oncontextmenu', { get: () => false, set: () => null })
        Object.defineProperty(item, 'onselectstart', { get: () => false, set: () => null })
        Object.defineProperty(item, 'ondragstart', { get: () => false, set: () => null })
        Object.defineProperty(item, 'oncopy', { get: () => false, set: () => null })
        Object.defineProperty(item, 'onbeforecopy', { get: () => false, set: () => null })
    }
    function hackClass(className) {
        for (const i of document.getElementsByClassName(className)) {
            hackItem(i);
        }
    }
    hackClass("subject_describe");
    hackItem(document.body);
    hackItem(document);
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

    if (GM_setClipboard) {
        GM_setClipboard(str);
    } else if (navigator.clipboard && window.isSecureContext) {
        console.log("正在使用 navigator clipboard api 进行复制操作");
        navigator.clipboard.writeText(str)
            .catch(err => {
                console.log("navigator clipboard api 复制时出错，将使用传统方法进行复制")
                _legacyCopy();
            })
    } else {
        _legacyCopy();
    }
}

/**
 * 点击题目自动复制
 */
function autoCopy() {
    async function _onClick() {
        console.log($(this));
        let question = $(this).text();
        copyMe(question);
        $(this).css("background-color", "#ECECEC");
        setTimeout(function (elem) {
            elem.css("background-color", "#FFFFFF");
        }, 200, $(this));
    }
    document.querySelectorAll('.subject_describe').forEach(function (elem) {
        let timu = elem.querySelector("p>p>span") ? elem.querySelector("p>p>span") : elem.querySelector("p");
        $(timu).on("click", _onClick);
    })
    document.querySelectorAll('.smallStem_describe').forEach(function (elem) {
        let timu = elem.querySelector("p>p>span") ? elem.querySelector("p>p>span") : elem.querySelector("p");
        $(timu).on("click", _onClick);
    })
}

/**
 * 在题目下方插入答案
 */
async function insertAnswer() {
    queryLock = true;
    for (let elem of $('.subject_describe')) {
        let questionElem = elem.querySelector("p>p>span") ? elem.querySelector("p>p>span") : elem.querySelector("p");
        questionElem.setAttribute("class", "question");
        let answers = await findAnswer($(questionElem).text());
        let hasAnswer = false;
        for (let i = 1; i <= answers.length; i++) {
            if (answers[i - 1]) {
                let answerElem = $(`<p class="answer" style="color:green;" title="${answers[i - 1].question}">题库${i}: ${answers[i - 1].answer}</p>`);
                $(questionElem).parent().append(answerElem);
                $(answerElem).on("click", function () {
                    $(answerElem).css("background-color", "#ECECEC");
                    setTimeout(function (elem) {
                        elem.css("background-color", "#FFFFFF");
                    }, 200, $(answerElem));
                    copyMe(answers[i - 1]);
                });
                hasAnswer = true;
            }
        }
        if (!hasAnswer) {
            let errorElem = $(`<p class="answer" style="color:red;">未搜索到答案，你可以尝试点击我重新搜索。</p>`)
            $(elem).append(errorElem);
            errorElem.on("click", async function () {
                if (!queryLock) {
                    let qustionElem = $(this).parent().find(".question");
                    let question = qustionElem.text();
                    let answers = await findAnswer(question);
                    for (let i = 1; i <= answers.length; i++) {
                        if (answers[i - 1]) {
                            errorElem.remove();
                            let answerElem = $(`<p class="answer" style="color:green;" title="${answers[i - 1].question}">题库${i}: ${answers[i - 1].answer}</p>`);
                            $(qustionElem).parent().append(answerElem);
                            $(answerElem).on("click", function () {
                                $(answerElem).css("background-color", "#ECECEC");
                                setTimeout(function (elem) {
                                    elem.css("background-color", "#FFFFFF");
                                }, 200, $(answerElem));
                                copyMe(answers[i - 1]);
                            });
                        }
                    }
                } else {
                    showDialog("正在自动查询答案，请等待查询完毕后重试", 1, true, true);
                }
            })
        }
    }
    queryLock = false;
}

/**
 * 查找题目的答案
 * @param {string} question 题目
 * @return {Promise<[String]>} 答案列表
 */
function findAnswer(question) {
    function requestAnswer(apiUrl) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: apiUrl,
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded',
                },
                data: 'question=' + encodeURIComponent(question),
                timeout: 5000,
                onload: function (xhr) {
                    if (xhr.status == 200) {
                        try {
                            let obj = $.parseJSON(xhr.responseText) || {};
                            let answer = {
                                answer: obj.data.answer ? obj.data.answer : obj.data,
                                question: obj.data.question ? obj.data.question : ""
                            };
                            if (obj.code && !answer.answer.includes("未搜索到") && !answer.answer.includes("错误码") && !answer.answer.includes("稍后重试") && !answer.answer.includes("未收录")) {
                                log(`From ${apiUrl}: ${answer.answer}`);
                                resolve(answer);
                            } else {
                                reject(`服务器返回了${answer.answer}`);
                            }
                        } catch (error) {
                            logError(`出现错误${error}`);
                            reject(`服务器返回了${decodeURIComponent(xhr.responseText)}`)
                        }
                    } else if (xhr.status == 403) {
                        reject(`服务器返回了${decodeURIComponent(xhr.responseText)}`);
                    } else {
                        reject('题库异常,可能被恶意攻击了...请等待恢复');
                    }
                },
                ontimeout: async function () {
                    reject('服务器超时');
                }
            });
        });
    }

    async function requestAnswerWithRetry(apiUrl, maxRetry = 3) {
        let retryCnt = 0;
        async function run() {
            return await requestAnswer(apiUrl).catch(function (err) {
                ++retryCnt;
                if (retryCnt > maxRetry) {
                    logError(`达到最大重试次数！错误：${err}`);
                    throw err;
                }
                logError(`重试 #${retryCnt}，因为出现错误：${err}`);
                return sleep(1000).then(run);
            })
        }
        return await run();
    }

    return new Promise(async (resolve, reject) => {
        let answers = [];
        for (let api of ["http://api.muketool.com/v1/zhs", "http://cx.icodef.com/wyn-nb?v=2", "http://api.zhizhuoshuma.cn/api/cx/"]) {
            try {
                let answer = await requestAnswerWithRetry(api);
                answers.push(answer);
            } catch (err) {
                answers.push(null);
            }
        }
        if (answers.length > 0) {
            resolve(answers);
        } else {
            reject();
        }
    });
}

/**
 * 返回学堂
 */
function backToMenu() {
    if ($('.back').length > 0) {
        $('.back').click()
    }
}

let dialog_number = 0;  // 弹窗编号
let dialog_timeout = 5;  // 弹窗自动关闭倒计时
/**
 * 显示提示信息弹窗
 * @param msg 弹窗内消息内容
 * @param timeout 弹窗自动收起的超时时间（秒），默认为 3，最小为 1
 * @param disable_header 不显示对话框标题栏，默认为 false
 * @param disable_footer 不显示对话框按钮栏，默认为 false
 */
function showDialog(msg, timeout = 3, disable_header = false, disable_footer = false) {
    msg = msg || "默认消息内容";
    dialog_timeout = timeout - 1;
    let dialogId = {
        DialogContent: getRandString(getRandInt(5, 20)),
        DialogCloseButton: getRandString(getRandInt(5, 20)),
        DialogConfirmButton: getRandString(getRandInt(5, 20)),
        Dialog: getRandString(getRandInt(5, 20)),
    }
    let _html = `
        <div class="el-dialog__body">
            <div class="operate-dialog-1" id="` + dialogId.DialogContent + `">
                <p>` + msg + `</p>
            </div>
        </div>
    `;
    if (!disable_header) {
        _html = `
            <div class="el-dialog__header">
                <span class="el-dialog__title">提示</span>
                <button type="button" aria-label="Close" class="el-dialog__headerbtn" id="` + dialogId.DialogCloseButton + `">
                    <i class="el-dialog__close el-icon el-icon-close"></i>
                </button>
            </div>
        ` + _html;
    }
    if (!disable_footer) {
        _html += `
            <div class="el-dialog__footer">
                <span class="dialog-footer">
                    <button type="button" class="el-button btn el-button--primary" id="` + dialogId.DialogConfirmButton + `">
                        <span id="confirm-btn">我知道了 (` + dialog_timeout + `)</span>
                    </button>
                </span>
            </div>`
    }
    _html = `
        <div class="el-dialog__wrapper dialog-tips" style="z-index: 2001;">
            <div role="dialog" aria-modal="true" aria-label="提示" class="el-dialog" style="margin-top: 15vh;" id="` + dialogId.Dialog + `">
    ` + _html + `
            </div>
        </div>
    `
    $('#app').before(_html);

    /**
     * 关闭弹窗
     */
    function closeDialog() {
        $('.dialog-tips').remove()
    }

    $('#' + dialogId.Dialog).css('width', '400px')
    $('#' + dialogId.DialogContent).css({ "margin": "0 20px", "padding": "10px 0px 0px" });
    $('#' + dialogId.DialogCloseButton).on('click', closeDialog);
    $('#' + dialogId.DialogConfirmButton).on('click', closeDialog);
    /**
     * 超时后自动关闭弹窗
     */
    function countDown() {
        if (dialog_timeout > 0) {
            $('#confirm-btn').text('我知道了 (' + dialog_timeout + ')')
            window.setTimeout(countDown, 1000);
            dialog_timeout--;
        } else {
            closeDialog();
        }
    }
    window.setTimeout(countDown, 1000);
}



/**
 * 生成随机字符串
 * @param len: 字符串长度
 * @returns `string`
 */
function getRandString(len = 10) {
    const str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let ret = "";
    for (let i = 0; i < len; i++) {
        ret += str.charAt(Math.floor(Math.random() * str.length));
    }
    return ret
}

/**
 * 生成范围内随机数
 * @param min: 最小值
 * @param max: 最大值
 * @returns `number`
 */
function getRandInt(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min, 10)
}

/**
 * 在页面中插入“脚本设置”按钮
 */
function configHotkeyBinding() {
    /**
     * 点击“脚本设置”按钮时执行
     */
    function onConfig() {
        if (!myConfigState) {
            GM_config.open();
        } else {
            GM_config.save();
        }
    }

    if ($(".Patternbtn-div").length > 0) {
        let elem = $(`
            <div class="Patternbtn-div">
                <a>
                    <svg t="1606714930658" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2087" width="32" height="32">
                    <path d="M477.87008 204.8h68.25984v85.32992h-68.25984zM614.4 341.32992H409.6V409.6h68.27008v409.6h68.25984V409.6H614.4zM273.07008 204.8h68.25984v221.87008h-68.25984zM409.6 477.87008H204.8v68.27008h68.27008V819.2h68.25984V546.14016H409.6zM682.67008 204.8h68.25984v358.4h-68.25984zM819.2 614.4H614.4v68.25984h68.27008V819.2h68.25984V682.65984H819.2z" p-id="2088" fill="#FFFFFF" fill-opacity="0.75">
                    </path>
                    </svg>
                    <p> 脚本设置 </p>
                </a>
            </div>`);
        elem.on("click", onConfig);
        $(".Patternbtn-div").before(elem);
    }

    if ($(".onlineSchool_link").length > 0) {
        let elem = $(`
                <div class="onlineSchool_link fr">
                    <a style="cursor: pointer;">
                    脚本设置
                    </a>
                </div>`);
        elem.on("click", onConfig);
        $(".onlineSchool_link").after(elem);
    }

    document.onkeyup = function (e) {
        if (e.altKey && e.code === "KeyS") {
            onConfig();
        }
    }
}

(function () {
    'use strict';
    /**
     * 一些仅在加载完成后执行一次的功能
     */
    function oneShot() {
        configHotkeyBinding();
        if (window.location.href.indexOf("onlineexamh5new.zhihuishu.com") !== -1
            && (window.location.href.indexOf("dohomework") !== -1 || window.location.href.indexOf("doexamination") !== -1)) {
            //测试题
            if (autoCopyEnable) {
                setTimeout(showDialog, 1000, '点击题目或答案可以一键复制噢');
                let autocp = setInterval(function () {
                    if ($('.subject_describe').length > 0) {
                        autoCopy();
                        log('自动复制已启用');
                        clearInterval(autocp);
                    }
                }, 1000);
            }
            if (copyEnable) {
                copyEnabler();
            }
            if (autoFindAnswer) {
                let xx = setInterval(function () {
                    if ($('.subject_describe').length > 0) {
                        insertAnswer();
                        log('开始自动搜索答案');
                        clearInterval(xx);
                    }
                }, 1000);
            }
        }
        if (explorerDetect() === 'Safari'
            && window.location.href.indexOf("studyh5.zhihuishu.com") !== -1
            && autoMute == false) {
            window.setTimeout(showDialog, 1000, "由于Safari的限制，不允许视频自动播放，因此使用此脚本的自动播放功能时必须启用自动静音功能");
        }
    }

    /**
     * 主循环
     */
    function mainLoop() {
        try {
            init();
            if (window.location.href.indexOf("studyh5.zhihuishu.com") !== -1 && gxkEnable) {
                //共享课
                if ($(".controlsBar").length > 0) {
                    //log("视频正常加载");
                    autoSwitch15x();
                    autoSwitchBQ();
                    autoSwitchMute();
                    closeTips();
                    closePopUpTest();
                    progressBarMonitor();
                    pauseDetector();
                    stuckDetector();
                    if (autoStop && (new Date().getTime() - startTime > autoStopTime * 60 * 1000)) {
                        backToMenu();
                    }
                } else {
                    //log("视频未加载");
                    stuckDetector();
                }
            }
        }
        catch (err) {
            console.log(dateTime(), err.message);
        }
    }

    function main() {
        GM_config.init(myConfig);  //使用 myConfig 初始化 GM_config 设置面板
        init();
        oneShot();
        window.setInterval(mainLoop, (timeInterval * 1000));
        log("启动成功");
    }

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
        main();
    })
    window.onload = main;
})();
