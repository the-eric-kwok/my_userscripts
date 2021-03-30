// ==UserScript==
// @name         [Reload]智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频
// @namespace    https://github.com/the-eric-kwok/zhihuishu_reload
// @version      1.1.1
// @description  智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频
// @author       EricKwok, C选项_沉默
// @homepage     https://github.com/the-eric-kwok/zhihuishu_reload
// @supportURL   https://github.com/the-eric-kwok/zhihuishu_reload/issues
// @match        *://studyh5.zhihuishu.com/videoStudy*
// @match        *://onlineexamh5new.zhihuishu.com/stuExamWeb.html*
// @require      https://codechina.csdn.net/-/snippets/198/raw/master/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
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

window.onresize = function () {
    // 监听窗口大小改变
    if ($("iframe#MyConfig").css('left') !== undefined) {
        $("iframe#MyConfig").css('left', (document.body.clientWidth - 450) + 'px');
    }

}

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


function sleep(ms = 10) {
    // 异步等待，只阻塞当前脚本调用处函数，不阻塞整个浏览器
    // 调用方法：await sleep() 或 await sleep (1000)
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            resolve();
        }, ms);
    })
}

function dateTime() {
    var t = new Date();
    return '[' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds() + '] ';
}

function log(message) {
    console.log(dateTime() + '[智慧树助手] ' + message);
}

function gxk_get_not_played() {
    //共享课获取未观看列表
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
        "[未完成检测] 更新未看列表，还剩" + video_labels.length + "个视频未完成。\n",
        { "点击展开全部": video_labels }
    );
    return video_labels;
}

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

function autoSwitchBQ() {
    if ($(".definiLines .active")[0].className === "line1gq switchLine active" && autoBQ) {
        log('切换到标清');
        if ($(".line1bq.switchLine").length > 0) {
            $(".line1bq.switchLine")[0].click();
        }
    }
}

function autoSwitchMute() {
    if ($("video")[0].volume > 0 && autoMute) {
        log('自动静音');
        if ($(".volumeIcon").length > 0) {
            $(".volumeIcon")[0].click();
        }
    }
}

function closeTips() {
    /*关闭「学前必读」弹窗*/
    if ($('.dialog[style!="display: none;"]:has(.dialog-read)').length > 0) {
        log("学前必读已关闭");
        $('.iconguanbi').click();
    }

    if ($('.dialog-warn').css('display') !== 'none') {
        console.log('智慧树警告已关闭', $('.el-icon-close'));
        $('.el-icon-close').click();
    }

    if ($('#close_windowa').length > 0) {
        log("已关闭提示弹窗");
        $('#close_windowa')[0].click();
    }
}

async function closePopUpTest() {
    /*弹题测验*/
    if (autoClosePopUpTest) {
        var pop_up = $('.dialog-test');
        if (pop_up.length > 0) {
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
                "[弹题测验] 为您跳过弹题测验，" +
                ((answer === guess_char) ? ("一次蒙对，答案：" + answer) : ("蒙的" + guess_char + '，正确答案：' + answer))
                + "。"
            );
        }
    }
}

function progressBarMonitor() {
    /*检测是否播放完成*/
    var progress_bar = $('.nPlayTime');
    //监控进度条
    // console.log(progress_bar.children);
    if (progress_bar.children().length > 0 && autoPlayNext) {
        var ProgressBar = progress_bar.children('.currentTime').text();
        if ((ProgressBar !== '00:00:00') && (ProgressBar === progress_bar.children('.duration').text())) {
            log("[进度条] 检测到进度条已满。");
            var next_video = null;
            if (window.location.href.indexOf("studyh5.zhihuishu.com") !== -1) {
                next_video = $(gxk_get_not_played()[0]);
            }
            log("已为您自动切换下一集");
            next_video.click();
        }
    }
}

function pauseDetector() {
    /*暂停检测*/
    if (pauseResume) {
        var play_Button = $(".playButton");
        if (play_Button.length > 0) {
            //点击暂停按钮，将继续播放视频
            play_Button.click();
            log("[暂停检测] 继续播放。");
            // play_Button.children[0].click();
        }
    }
}

function stuckDetector() {
    /*卡顿检测*/
    if (abnormalStuckDetectionEnable) {
        var progress_bar = $('.nPlayTime');
        var ProgressBar = progress_bar.children('.currentTime').text();
        if ($("video").length > 0 && progress_bar.children().length > 0 && abnormalStuckDetectionLimit > 0 && pauseResume) {
            if (ProgressBar !== lastProgressBar) {
                if (stuckCount !== 0) {
                    log("[卡顿检测] 已恢复播放，取消页面刷新计划。");
                }
                stuckCount = 0;
            }
            else {
                if (stuckCount >= abnormalStuckDetectionLimit) {
                    stuckCount = 0;
                    location.reload();
                }
                else {
                    stuckCount += 1;
                    log("[卡顿检测] 即将刷新页面…… " + stuckCount + "/" + abnormalStuckDetectionLimit);
                }
            }
            lastProgressBar = ProgressBar;
        }
    }
}

function copyEnabler() {
    // 强制复制
    if (document.onselectstart !== null) {
        log('强制复制');
        document.oncontextmenu = null;
        document.onpaste = null;
        document.oncopy = null;
        document.oncut = null;
        document.onselectstart = null;
    }
}

function autoCopy() {
    // 点击题目自动复制
    function _autoCopy() {
        console.log($(this).text());
        GM_setClipboard($(this).text());
        $(this).css("background-color", "#ECECEC");
        setTimeout(function (elem) {
            elem.css("background-color", "#FFFFFF");
        }, 400, $(this));
    }
    $('.subject_describe').on("click", _autoCopy);
    $('.smallStem_describe').on("click", _autoCopy);

}

function backToMenu() {
    $('.back').click()
}

var dialog_number = 0
function showDialog(msg) {
    // 显示提示信息弹窗
    if (!dialog_number)
        dialog_number = 0;
    else
        dialog_number++;
    $('#app').before('<div class="el-dialog__wrapper dialog-tips" style="z-index: 2001;">' +
        '  <div role="dialog" aria-modal="true" aria-label="提示" class="el-dialog" style="margin-top: 15vh;" id="Dialog' + dialog_number + '">' +
        '    <div class="el-dialog__header">' +
        '      <span class="el-dialog__title">✅智慧树助手提示您✅</span>' +
        '      <button type="button" aria-label="Close" class="el-dialog__headerbtn" id="DialogCloseButton' + dialog_number + '">' +
        '        <i class="el-dialog__close el-icon el-icon-close"></i>' +
        '      </button>' +
        '    </div>' +
        '    <div class="el-dialog__body">' +
        '      <div class="operate-dialog-1" id="DialogContent' + dialog_number + '">' +
        '        <p>' + msg + '</p>' +
        '      </div> ' +
        '    </div>' +
        '    <div class="el-dialog__footer">' +
        '      <span class="dialog-footer">' +
        '        <button type="button" class="el-button btn el-button--primary" id="DialogConfirmButton' + dialog_number + '">' +
        '          <span>我知道了</span>' +
        '        </button>' +
        '      </span>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
    $('#Dialog' + dialog_number).css('width', '400px')
    $('#DialogContent' + dialog_number).css("margin", "0 20px");
    function closeDialog() {
        $('.dialog-tips').remove()
    }
    $('#DialogCloseButton' + dialog_number).on('click', closeDialog);
    $('#DialogConfirmButton' + dialog_number).on('click', closeDialog);
}

function oneShot() {
    if (window.location.href.indexOf("onlineexamh5new.zhihuishu.com") !== -1 && autoCopyEnable) {
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
    if (explorerDetect() === 'Safari' && (window.location.href.indexOf("studyh5.zhihuishu.com") !== -1 || window.location.href.indexOf("lc.zhihuishu.com") !== -1)) {
        window.setTimeout(showDialog, 1000, "由于Safari的限制，不允许视频自动播放，因此使用此脚本的自动播放功能时必须启用自动静音功能");
    }

}

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
        }
    }
    catch (err) {
        console.log(dateTime(), err.message);
    }
}

function config_button_inject() {
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

function onConfig() {
    // 点击“脚本设置”按钮时
    if (!myConfigState) {
        GM_config.open();
    } else {
        GM_config.save();
    }
}

(function () {
    'use strict';
    window.onload = window.setInterval(mainLoop, (timeInterval * 1000));
    GM_config.init(myConfig);
    init();
    oneShot();
    log("启动成功");
})();

