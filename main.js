// ==UserScript==
// @name         [Reload]智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频
// @namespace    http://tampermonkey.net/
// @version      1.0.2.0
// @description  智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频,使用时请注意您的网址因为它只能在https://studyh5.zhihuishu.com/videoStudy*上运行
// @author       EricKwok, C选项_沉默
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

/* ============配置区域============ */
var gxk_enable = 1; //共享课是否启用本脚本，1为开启，0为关闭
var jmk_enable = 1; //见面课是否启用本脚本，1为开启，0为关闭
var auto_mute = 1;  //是否自动静音，1为开启，0为关闭
var auto_15x = 1;   //是否自动开启1.5倍率，1为开启，0为关闭
var auto_bq = 1;    //是否自动开启标清，1为开启，0为关闭
var timeInterval = 1000; //脚本循环检测时间间隔1000表示1秒
var abnormalStuckDetectionLimit = 10; //异常卡顿检查，当异常卡顿检查连续5次发现到视频进度没有变化时刷新，-1禁用
/* ==========配置区域结束=========== */

var stuckCount = 0; //卡顿计数
var lastProgressBar = ''; //进度条缓存
var shotFlags = 0x0;

var myConfig = {
    'id': 'MyConfig', // The id used for this instance of GM_config
    'title': '智慧树助手 - 设置', // Panel Title
    'events':
    {
        'open': function (doc) {
            // translate the buttons
            var config = this;
            doc.getElementById(config.id + '_saveBtn').textContent = "保存";
            doc.getElementById(config.id + '_closeBtn').textContent = "关闭";
            doc.getElementById(config.id + '_resetLink').textContent = "重置";
        },
    },
    'fields': // Fields object
    {
        'gxk_enable':
        {
            'label': '在共享课上启用脚本',
            'type': 'checkbox',
            'default': true
        },
        'jmk_enable':
        {
            'label': '在见面课上启用脚本',
            'type': 'checkbox',
            'default': true
        },
        'copy_enable':
        {
            'label': '在章节测试解除复制封印',
            'type': 'checkbox',
            'default': true
        },
        'timeInterval': // This is the id of the field
        {
            'label': '检测时间间隔（秒）', // Appears next to field
            'type': 'int', // Makes this setting a text field
            'default': 1 // Default value if user doesn't change it
        },
        'abnormalStuckDetectionEnable':
        {
            'label': '异常卡顿自动刷新',
            'type': 'checkbox',
            'default': true
        },
        'abnormalStuckDetectionLimit':
        {
            'label': '异常卡顿超时时长（秒）',
            'type': 'int',
            'default': 10
        },
        'autoMute':
        {
            'label': '自动静音',
            'type': 'checkbox',
            'default': true
        },
        'auto15x':
        {
            'label': '自动切换1.5倍速',
            'type': 'checkbox',
            'default': true
        },
        'autoBQ':
        {
            'label': '自动切换标清',
            'type': 'checkbox',
            'default': true
        }
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
    console.log(video_labels);
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
    console.log(video_labels);
    return (video_labels);
}

function one_shot() {
    // 只在网页加载后执行一次的功能
    if ($("video").length > 0 && $("video")[0].playbackRate != 1.5 && !(shotFlags & 0x1) && auto_15x) {
        log('切换到1.5倍');
        if ($(".speedTab15").length > 0){
            $(".speedTab15")[0].click();
        }
        if ($(".speedTab.speedTab15").length > 0){
            $(".speedTab.speedTab15")[0].click();
        }
        shotFlags |= 0x1;
    }

    if ($("video")[0].volume > 0 && !(shotFlags & 0x2) && auto_mute) {
        log('自动静音');
        if ($(".volumeIcon").length > 0) {
            $(".volumeIcon")[0].click();
        }
        shotFlags |= 0x2;
    }

    if($(".definiLines .active")[0].className === "line1gq switchLine active" && !(shotFlags & 0x4) && auto_bq) {
       log('切换到标清');
        if ($(".line1bq.switchLine").length > 0) {
            $(".line1bq.switchLine")[0].click();
        }
        shotFlags |= 0x4;
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
            shotFlags = 0x0; //切换视频的时候重置one_shot函数的flag
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
    if(window.location.href.indexOf("onlineexamh5new.zhihuishu.com") !== -1){
        //测试题
        copyEnabler();
    }
    else if(window.location.href.indexOf("studyh5.zhihuishu.com") !== -1 && gxk_enable == 1){
        //共享课
        one_shot();
        closeTips();
        closePopUpTest();
        progressBarMonitor();
        pauseDetector();
        stuckDetector();
    }
    else if(window.location.href.indexOf("lc.zhihuishu.com") !== -1 && jmk_enable == 1) {
        //见面课
        one_shot();
        closeTips();
        pauseDetector();
        progressBarMonitor();
    }
}

function config_button_inject() {
    if ($(".newListTest").length > 0) {
        console.log($(".newListTest"));
        $(".newListTest").append('\
<li class="homeworkExam">\
<a id="myConfBtn">\
<svg t="1606714930658" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2087" width="32" height="32">\
<path d="M477.87008 204.8h68.25984v85.32992h-68.25984zM614.4 341.32992H409.6V409.6h68.27008v409.6h68.25984V409.6H614.4zM273.07008 204.8h68.25984v221.87008h-68.25984zM409.6 477.87008H204.8v68.27008h68.27008V819.2h68.25984V546.14016H409.6zM682.67008 204.8h68.25984v358.4h-68.25984zM819.2 614.4H614.4v68.25984h68.27008V819.2h68.25984V682.65984H819.2z" p-id="2088" fill="#3d84ff">\
</path>\
</svg>\
<div>脚本设置</div>\
</a>\
</li>');
        $("#myConfBtn").on("click", onConfig);
    }

    if ($("ul:has('.zhibo')").length > 0) {
        console.log($("ul:has('.zhibo')"));
        $(".useImg").before('\
<li>\
<a id="myConfBtn" class="zhibo">\
脚本设置\
</a>\
<\li>');
        $("#myConfBtn").on("click", onConfig);
    }
}

function onConfig() {
    GM_config.open();
}

(function () {
    'use strict';
    window.setTimeout(function() {
        var explorer = window.navigator.userAgent;
        if(explorer.indexOf("Safari") >= 0){
            alert("由于Safari的限制，不允许视频自动播放，因此使用此脚本的自动播放功能时必须启用自动静音功能。");
        }
    }, 3000)
    window.onload = window.setInterval(mainLoop, timeInterval);
    GM_config.init(myConfig);
    window.setTimeout(config_button_inject, 3000);
    log("启动成功");
})();

