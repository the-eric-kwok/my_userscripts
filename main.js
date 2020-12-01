// ==UserScript==
// @name         [Reload]智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频
// @namespace    https://github.com/the-eric-kwok/zhihuishu_reload
// @version      1.0.2.3
// @description  智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频,使用时请注意您的网址因为它只能在https://studyh5.zhihuishu.com/videoStudy*上运行
// @author       EricKwok, C选项_沉默
// @homepage     https://github.com/the-eric-kwok/zhihuishu_reload
// @supportURL   https://github.com/the-eric-kwok/zhihuishu_reload/issues
// @match        *://studyh5.zhihuishu.com/videoStudy*
// @match        *://onlineexamh5new.zhihuishu.com/stuExamWeb.html*
// @match        *://lc.zhihuishu.com/live/vod_room.html*
// @require      https://greasyfork.org/scripts/28536-gm-config/code/GM_config.js?version=184529
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// @license      GPL
// ==/UserScript==

var gxkEnable = true;
var jmkEnable = true;
var copyEnable = true;
var autoMute = true;
var auto15x = true;
var autoBQ = true;
var timeInterval = 1;
var abnormalStuckDetectionLimit = 10;

var stuckCount = 0; //卡顿计数
var lastProgressBar = ''; //进度条缓存

var myConfigState = false;
var myConfig = {
    'id': 'MyConfig', // The id used for this instance of GM_config
    'title': '智慧树助手 - 设置', // Panel Title
    'fields': {
        'gxkEnable': {
            'label': '在共享课上启用脚本',
            'type': 'checkbox',
            'default': true
        },
        'jmkEnable': {
            'label': '在见面课上启用脚本',
            'type': 'checkbox',
            'default': true
        },
        'copyEnable': {
            'label': '在章节测试解除复制封印',
            'type': 'checkbox',
            'default': true
        },
        'timeInterval': {
            'label': '检测时间间隔（秒）', // Appears next to field
            'type': 'int', // Makes this setting a text field
            'default': 1 // Default value if user doesn't change it
        },
        'abnormalStuckDetectionEnable': {
            'label': '异常卡顿自动刷新（只适用于共享课）',
            'type': 'checkbox',
            'default': true
        },
        'abnormalStuckDetectionLimit': {
            'label': '异常卡顿超时时长（秒）',
            'type': 'int',
            'default': 10
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
        }
    },
    'events': {
        'save': function() {
            GM_config.close();
            log("配置已保存");
        },
        'open': function (doc) {
            // translate the buttons
            var config = this;
            doc.getElementById(config.id + '_saveBtn').textContent = "确定";
            doc.getElementById(config.id + '_closeBtn').textContent = "取消";
            doc.getElementById(config.id + '_resetLink').textContent = "重置";
            // 更改设置页面的宽度为屏幕的50%
            $('iframe#'+config.id).css({
                'width': '400px',
                'left': (document.body.clientWidth - 450)+'px',
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
        'close': function(doc) {
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

function explorer() {
    if(navigator.userAgent.indexOf("Opera") > -1) {
        return 'Opera';
    }
    else if (navigator.userAgent.indexOf("Firefox") > -1) {
        return 'Firefox';
    }
    else if (navigator.userAgent.indexOf("Chrome") > -1){
        return 'Chrome';
    }
    else if(navigator.userAgent.indexOf("Safari") > -1) {
        return 'Safari';
    }
    else if (navigator.userAgent.indexOf("compatible") > -1 && navigator.userAgent.indexOf("MSIE") > -1 && !(navigator.userAgent.indexOf("Opera") > -1)) {
        return "IE";
    }
}

function sleep(milliSeconds = 10) {
    //等待10ms
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds) {
    }
}

function date_time() {
    var t = new Date();
    return '[' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds() + '] ';
}

function log(message) {
    console.log(date_time() + '[智慧树助手] ' + message);
}

function gxk_get_not_played() {
    //共享课获取未观看列表
    var video_labels = [];
    var list = $('ul.list');
    if (list.length > 0) {
        list.each(function (ul_index, ul_ele) { //章节
            $(ul_ele).children().each(function (div_index, div_ele) { // x.x
                $(div_ele).children('li').each(function (video_label_index, video_label_ele) { // x.x.x
                    if ($(video_label_ele).find('b.fl.time_icofinish').length === 0) {
                        if (!$(video_label_ele).hasClass('current_play')){ // 排除当前播放
                            video_labels.push(video_label_ele);
                        }
                    }
                });
            });
        });
    }
    log(
        "[未完成检测] 更新未看列表，还剩" + video_labels.length + "个视频未完成。\n",
        {"点击展开全部": video_labels}
    );
    return video_labels;
}

function jmk_get_not_played() {
    //见面课获取未观看列表
    var video_labels = [];
    var list = $('.videomenu').not('.current_player');
    if (list.length > 0) {
        list.each(function (list_index, list_ele) {
            if($(list_ele).children('.videoCurrent').children('span')[0].innerText !== '100%') {
                video_labels.push(list_ele);
            }
        })
    }
    return (video_labels);
}

function autoSwitch15x() {
    if ($("video").length > 0 && $("video")[0].playbackRate != 1.5 && auto15x) {
        log('切换到1.5倍');
        if ($(".speedTab15").length > 0){
            $(".speedTab15")[0].click();
        }
        if ($(".speedTab.speedTab15").length > 0){
            $(".speedTab.speedTab15")[0].click();
        }
    }
}

function autoSwitchBQ() {
    if($(".definiLines .active")[0].className === "line1gq switchLine active" && autoBQ) {
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
    $('.el-icon-close').click();

    if ($('#close_windowa').length > 0) {
        log("已关闭提示弹窗");
        $('#close_windowa')[0].click();
    }
}

function closePopUpTest() {
    /*弹题测验*/
    var pop_up = $('.dialog-test');
    if (pop_up.length > 0) {
        //关闭出现的检测题
        var topic_item = $('.topic-item');
        var guess_answer = parseInt(Math.random() * topic_item.length);
        topic_item[guess_answer].click();
        sleep();
        var guess_char = 'ABCD'[guess_answer];
        //随机点击一个选项
        var answer = $('.answer').children().text();
        //选出正确答案
        if (answer.indexOf('A')!==-1 && answer.indexOf(guess_char)===-1) {
            topic_item[0].click();
        }
        if (answer.indexOf('B')!==-1 && answer.indexOf(guess_char)===-1) {
            topic_item[1].click();
        }
        if (answer.indexOf('C')!==-1 && answer.indexOf(guess_char)===-1) {
            topic_item[2].click();
        }
        if (answer.indexOf('D')!==-1 && answer.indexOf(guess_char)===-1) {
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

function progressBarMonitor() {
    /*检测是否播放完成*/
    var progress_bar = $('.nPlayTime');
    //监控进度条
    // console.log(progress_bar.children);
    if (progress_bar.children().length > 0) {
        var ProgressBar = progress_bar.children('.currentTime').text();
        if ((ProgressBar !== '00:00:00') && (ProgressBar.slice(0,-3) === progress_bar.children('.duration').text().slice(0,-3))) {
            log("[进度条] 检测到进度条已满。");
            var next_video = null;
            if (window.location.href.indexOf("studyh5.zhihuishu.com") !== -1){
                next_video = $(gxk_get_not_played()[0]);
            }
            else if (window.location.href.indexOf("lc.zhihuishu.com") !== -1) {
                next_video = $(jmk_get_not_played()[0]);
            }
            log("已为您自动切换下一集");
            next_video.click();
        }
    }
}

function pauseDetector() {
    /*暂停检测*/
    var play_Button = $(".playButton");
    if (play_Button.length > 0) {
        //点击暂停按钮，将继续播放视频
        play_Button.click();
        log("[暂停检测] 继续播放。");
        // play_Button.children[0].click();
    }
}

function stuckDetector() {
    /*卡顿检测*/
    var progress_bar = $('.nPlayTime');
    var ProgressBar = progress_bar.children('.currentTime').text();
    if ($("video").length > 0 && progress_bar.children().length > 0 && abnormalStuckDetectionLimit > 0) {
        if(ProgressBar !== lastProgressBar){
            if(stuckCount!==0){
                log("[卡顿检测] 已恢复播放，取消页面刷新计划。");
            }
            stuckCount = 0;
        }
        else{
            if(stuckCount >= abnormalStuckDetectionLimit){
                stuckCount = 0;
                location.reload();
            }
            else{
                stuckCount += 1;
                log("[卡顿检测] 即将刷新页面…… " + stuckCount + "/" + abnormalStuckDetectionLimit);
            }
        }
        lastProgressBar = ProgressBar;
    }
}

function copyEnabler() {
    // 强制复制
    if(document.onselectstart !== null){
        log('强制复制');
        document.oncontextmenu = null;
        document.onpaste = null;
        document.oncopy = null;
        document.oncut = null;
        document.onselectstart = null;
    }
}

function mainLoop() {
    try {
        gxkEnable = GM_config.get("gxkEnable");
        jmkEnable = GM_config.get("jmkEnable");
        copyEnable = GM_config.get("copyEnable");
        autoMute = GM_config.get("autoMute");
        auto15x = GM_config.get("auto15x");
        autoBQ = GM_config.get("autoBQ");
        timeInterval = GM_config.get("timeInterval");
        abnormalStuckDetectionLimit = GM_config.get("abnormalStuckDetectionLimit");
        config_button_inject();
        if(window.location.href.indexOf("onlineexamh5new.zhihuishu.com") !== -1 && copyEnable){
            //测试题
            copyEnabler();
        }
        else if(window.location.href.indexOf("studyh5.zhihuishu.com") !== -1 && gxkEnable){
            //共享课
            autoSwitch15x();
            autoSwitchBQ();
            autoSwitchMute();
            closeTips();
            closePopUpTest();
            progressBarMonitor();
            pauseDetector();
            stuckDetector();
        }
        else if(window.location.href.indexOf("lc.zhihuishu.com") !== -1 && jmkEnable) {
            //见面课
            autoSwitch15x();
            autoSwitchBQ();
            autoSwitchMute();
            closeTips();
            pauseDetector();
            progressBarMonitor();
        }
    }
    catch (err) {
        console.log(date_time(), err.message);
    }
}

function config_button_inject() {
    if ($('#myConfBtn').length == 0) {
        if ($(".Patternbtn-div").length > 0) {
            $(".Patternbtn-div").before([
                '<div class="Patternbtn-div">',
                '  <a id="myConfBtn">',
                '    <svg t="1606714930658" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2087" width="32" height="32">',
                '      <path d="M477.87008 204.8h68.25984v85.32992h-68.25984zM614.4 341.32992H409.6V409.6h68.27008v409.6h68.25984V409.6H614.4zM273.07008 204.8h68.25984v221.87008h-68.25984zM409.6 477.87008H204.8v68.27008h68.27008V819.2h68.25984V546.14016H409.6zM682.67008 204.8h68.25984v358.4h-68.25984zM819.2 614.4H614.4v68.25984h68.27008V819.2h68.25984V682.65984H819.2z" p-id="2088" fill="#FFFFFF">',
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
    if (!myConfigState){
        GM_config.open();
    } else {
        GM_config.save();
    }
}



(function () {
    'use strict';
    if(explorer() === 'Safari' && (window.location.href.indexOf("studyh5.zhihuishu.com") !== -1 || window.location.href.indexOf("lc.zhihuishu.com") !== -1)){
        window.setTimeout(function() {
            alert("由于Safari的限制，不允许视频自动播放，因此使用此脚本的自动播放功能时必须启用自动静音功能。");
        }, 3000);
    }
    window.onload = window.setInterval(mainLoop, (timeInterval*1000));
    GM_config.init(myConfig);
    gxkEnable = GM_config.get("gxkEnable");
    jmkEnable = GM_config.get("jmkEnable");
    copyEnable = GM_config.get("copyEnable");
    autoMute = GM_config.get("autoMute");
    auto15x = GM_config.get("auto15x");
    autoBQ = GM_config.get("autoBQ");
    timeInterval = GM_config.get("timeInterval");
    abnormalStuckDetectionLimit = GM_config.get("abnormalStuckDetectionLimit");
    log("启动成功");
})();

