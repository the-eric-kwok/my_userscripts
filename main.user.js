// ==UserScript==
// @name         [Reload]智慧树共享课挂机刷课助手
// @namespace    https://github.com/the-eric-kwok/zhihuishu_reload
// @version      1.2.5
// @description  智慧树共享课刷课、跳过弹题、自动换集、自动1.5倍速、自动静音、自动标清、解除考试复制封印及一键复制题目到剪贴板
// @author       EricKwok, C选项_沉默
// @homepage     https://github.com/the-eric-kwok/zhihuishu_reload
// @supportURL   https://github.com/the-eric-kwok/zhihuishu_reload/issues
// @match        *://studyh5.zhihuishu.com/videoStudy*
// @match        *://onlineexamh5new.zhihuishu.com/stuExamWeb.html*
// @require      https://greasyfork.org/scripts/28536-gm-config/code/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// @license      GPL
// ==/UserScript==

var gxkEnable = true;
var copyEnable = true;
var autoCopyEnable = true;
var abnormalStuckDetectionEnable = true;
var abnormalStuckDetectionLimit = 10;
var autoClosePopUpTest = true;
var pauseResume = true;
var autoMute = true;
var auto15x = true;
var autoBQ = true;
var autoPlayNext = true;
var autoStop = false;
var autoStopTime = 30;

var timeInterval = 1;  // 脚本主循环时间间隔

var stuckCount = 0;  // 卡顿计数
var lastProgressBar = '';  // 进度条缓存
var startTime = new Date().getTime();

var myConfigState = false;
var myConfig = {
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
            location.reload(); // 刷新页面
        },
        'open': function (doc) {
            // 翻译按钮文本
            var config = this;
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
                //'padding': '0 20px'
            });
            myConfigState = true;
        },
        'close': function (doc) {
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
    var t = new Date();
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
 * 获取未观看列表
 * @returns 未观看的网课列表
 */
function getNotPlayed() {
    var video_labels = [];
    var list = $('.clearfix.video');
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
    var pop_up = $('.dialog-test');
    if (pop_up.length > 0 && autoClosePopUpTest) {
        //关闭出现的检测题
        var topic_item = $('.topic-item');
        var guess_answer = parseInt(Math.random() * topic_item.length);
        topic_item[guess_answer].click();
        await sleep();
        var guess_char = 'ABCD'[guess_answer];
        //随机点击一个选项
        var answer = $('.answer').children().text();
        //选出正确答案
        if (answer.indexOf('A') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[0].click();
        }
        if (answer.indexOf('B') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[1].click();
        }
        if (answer.indexOf('C') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[2].click();
        }
        if (answer.indexOf('D') !== -1 && answer.indexOf(guess_char) === -1) {
            topic_item[3].click();
        }
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
    var progress_bar = $('.nPlayTime');
    //监控进度条
    if (progress_bar.length > 0 && progress_bar.children().length > 0 && autoPlayNext) {
        var ProgressBar = progress_bar.children('.currentTime').text();
        // 跳集条件：
        // 1. 剩余时间不为 00:00:00 （即视频已成功加载）
        // 2. 已播放时间与剩余时间相等（即视频已播放完毕）
        // 3. 右侧目录中正在播放的栏目需要有 time_icofinish 图标（即系统已记录下视频播放完成）
        // 若以上三个条件中任意一个不满足则不跳集，而是回到视频开头重新开始（或由 stuckDetector() 函数刷新页面）
        if ((ProgressBar !== '00:00:00') && (ProgressBar === progress_bar.children('.duration').text() &&
            ($('.current_play').find('.time_icofinish').length > 0))) {
            log("检测到进度条已满");
            var next_video = null;
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
    var play_Button = $(".playButton");
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
        var progress_bar = $('.nPlayTime');
        if (progress_bar.length > 0) {
            // 播放器正常加载的情况
            var ProgressBar = progress_bar.children('.currentTime').text();
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
    if (document.onselectstart !== null) {
        log('强制复制');
        document.oncontextmenu = null;
        document.onpaste = null;
        document.oncopy = null;
        document.oncut = null;
        document.onselectstart = null;
    }
}

/**
 * 点击题目自动复制
 */
function autoCopy() {
    function _autoCopy() {
        console.log($(this).text());
        let tmpInput = document.createElement('input');
        $(this).append(tmpInput)
        tmpInput.value = $(this).text();
        tmpInput.focus();
        tmpInput.select();
        if (document.execCommand('copy')) {
            document.execCommand('copy');
        }
        tmpInput.blur();
        console.log('复制成功');
        $(tmpInput).remove();
        showDialog("复制成功！", 1, true, true);
        $(this).css("background-color", "#ECECEC");
        setTimeout(function (elem) {
            elem.css("background-color", "#FFFFFF");
        }, 200, $(this));
    }
    $('.subject_describe').on("click", _autoCopy);
    $('.smallStem_describe').on("click", _autoCopy);
}

/**
 * 返回学堂
 */
function backToMenu() {
    if ($('.back').length > 0) {
        $('.back').click()
    }
}

var dialog_number = 0;  // 弹窗编号
var dialog_timeout = 5;  // 弹窗自动关闭倒计时
/**
 * 显示提示信息弹窗
 * @param {String} msg 弹窗内消息内容
 * @param {number} timeout 弹窗自动收起的超时时间（秒），默认为 5
 * @param {boolean} disable_header 不显示对话框标题栏，默认为 false
 * @param {boolean} disable_footer 不显示对话框按钮栏，默认为 false
 */
function showDialog(msg, timeout, disable_header, disable_footer) {
    msg = msg || "默认消息内容";
    timeout = timeout || 5;
    disable_header = disable_header || false;
    disable_footer = disable_footer || false;
    dialog_timeout = timeout;
    if (!dialog_number)
        dialog_number = 0;
    else
        dialog_number++;
    _html =
        '<div class="el-dialog__body">' +
        '      <div class="operate-dialog-1" id="DialogContent' + dialog_number + '">' +
        '        <p>' + msg + '</p>' +
        '      </div> ' +
        '    </div>';
    if (!disable_header) {
        _html =
            '    <div class="el-dialog__header">' +
            '      <span class="el-dialog__title">✅智慧树助手提示您✅</span>' +
            '      <button type="button" aria-label="Close" class="el-dialog__headerbtn" id="DialogCloseButton' + dialog_number + '">' +
            '        <i class="el-dialog__close el-icon el-icon-close"></i>' +
            '      </button>' +
            '    </div>' +
            _html;
    }
    if (!disable_footer) {
        _html +=
            '    <div class="el-dialog__footer">' +
            '      <span class="dialog-footer">' +
            '        <button type="button" class="el-button btn el-button--primary" id="DialogConfirmButton' + dialog_number + '">' +
            '          <span id="confirm-btn">我知道了 (' + dialog_timeout + ')</span>' +
            '        </button>' +
            '      </span>' +
            '    </div>'
    }
    _html =
        '<div class="el-dialog__wrapper dialog-tips" style="z-index: 2001;">' +
        '  <div role="dialog" aria-modal="true" aria-label="提示" class="el-dialog" style="margin-top: 15vh;" id="Dialog' + dialog_number + '">' +
        _html +
        '  </div>' +
        '</div>'
    $('#app').before(_html);
    $('#Dialog' + dialog_number).css('width', '400px')
    $('#DialogContent' + dialog_number).css({ "margin": "0 20px", "padding": "10px 0px 0px" });
    function closeDialog() {
        $('.dialog-tips').remove()
    }
    $('#DialogCloseButton' + dialog_number).on('click', closeDialog);
    $('#DialogConfirmButton' + dialog_number).on('click', closeDialog);
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
 * 一些仅在加载完成后执行一次的功能
 */
function oneShot() {
    if (window.location.href.indexOf("onlineexamh5new.zhihuishu.com") !== -1
        && (window.location.href.indexOf("dohomework") !== -1 || window.location.href.indexOf("doexamination") !== -1)
        && autoCopyEnable) {
        //测试题
        setTimeout(showDialog, 1000, '点击题目可以一键复制噢～');
        var autocp = setInterval(function () {
            if ($('.subject_describe').length > 0) {
                autoCopy();
                log('自动复制已启用');
                clearInterval(autocp);
            }
        }, 1000);
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
        config_button_inject();
        if (window.location.href.indexOf("onlineexamh5new.zhihuishu.com") !== -1 && copyEnable) {
            //测试题
            copyEnabler();
        }
        else if (window.location.href.indexOf("studyh5.zhihuishu.com") !== -1 && gxkEnable) {
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

/**
 * 在页面中插入“脚本设置”按钮
 */
function config_button_inject() {
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
    if ($('#myConfBtn').length == 0) {
        if ($(".Patternbtn-div").length > 0) {
            $(".Patternbtn-div").before([
                '<div class="Patternbtn-div">',
                '  <a id="myConfBtn">',
                '    <svg t="1606714930658" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2087" width="32" height="32">',
                '      <path d="M477.87008 204.8h68.25984v85.32992h-68.25984zM614.4 341.32992H409.6V409.6h68.27008v409.6h68.25984V409.6H614.4zM273.07008 204.8h68.25984v221.87008h-68.25984zM409.6 477.87008H204.8v68.27008h68.27008V819.2h68.25984V546.14016H409.6zM682.67008 204.8h68.25984v358.4h-68.25984zM819.2 614.4H614.4v68.25984h68.27008V819.2h68.25984V682.65984H819.2z" p-id="2088" fill="#FFFFFF" fill-opacity="0.75">',
                '      </path>',
                '    </svg>',
                '    <p>脚本设置</p>',
                '  </a>',
                '</div>'].join('\n'));
            $("#myConfBtn").on("click", onConfig);
        }

        if ($("ul:has('.zhibo')").length > 0) {
            $("ul:has('.zhibo')").children(":has('.zhibo.online-school')").before([
                '<li>',
                '  <a id="myConfBtn" class="zhibo" style="cursor: pointer;">',
                '  脚本设置',
                '  </a>',
                '<\li>'].join('\n'));
            $("#myConfBtn").on("click", onConfig);
        }

        if ($(".onlineSchool_link").length > 0) {
            $(".onlineSchool_link").after([
                '<div class="onlineSchool_link fr">',
                '  <a id="myConfBtn" style="cursor: pointer;">',
                '  脚本设置',
                '  </a>',
                '</div>'].join('\n'));
            $("#myConfBtn").on("click", onConfig);
        }
    }
}

(function () {
    'use strict';
    const key = encodeURIComponent('EricKwok:智慧树助手');
    if (window[key]) {
        //保证脚本只被加载一次
        return;
    }
    window[key] = true;
    window.onload = window.setInterval(mainLoop, (timeInterval * 1000));
    GM_config.init(myConfig);  //使用 myConfig 初始化 GM_config 设置面板
    init();
    oneShot();
    log("启动成功");
})();

