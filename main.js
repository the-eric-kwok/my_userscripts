// ==UserScript==
// @name         [Reload]智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频
// @namespace    http://tampermonkey.net/
// @version      1.0.1.0
// @description  智慧树共享课刷课,智慧树共享课自动跳过题目，智慧树共享课自动播放下一个视频，智慧树共享课自动播放未完成的视频,使用时请注意您的网址因为它只能在https://studyh5.zhihuishu.com/videoStudy*上运行
// @author       EricKwok, C选项_沉默
// @match        *://studyh5.zhihuishu.com/videoStudy*
// @match        *://onlineexamh5new.zhihuishu.com/stuExamWeb.html*
// @require      https://greasyfork.org/scripts/28536-gm-config/code/GM_config.js?version=184529
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @license      GPL
// ==/UserScript==

var timeInterval = 1000; //脚本循环检测时间间隔1000表示1秒
var abnormalStuckDetectionLimit = 10; //异常卡顿检查，当异常卡顿检查连续5次发现到视频进度没有变化时刷新，-1禁用

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

function get_not_played() {
    //获取未观看列表
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
    console.log(
        date_time() + "[未完成检测] 更新未看列表，还剩" + video_labels.length + "个视频未完成。\n",
        {"点击展开全部": video_labels}
    );
    return video_labels;
}

function one_shot() {
    // 只在网页加载后执行一次的功能
    if ($("video").length > 0 && $("video")[0].playbackRate != 1.5 && !(shotFlags & 0x1)) {
        console.log(date_time() + '切换到1.5倍');
        $(".speedTab15")[0].click();
        shotFlags |= 0x1;
    }

    if ($("video")[0].volume > 0 && !(shotFlags & 0x2)) {
        console.log(date_time() + '自动静音');
        $(".volumeIcon").click();
        shotFlags |= 0x2;
    }

    if($(".definiLines .active")[0].className === "line1gq switchLine active" && !(shotFlags & 0x4)) {
        console.log(date_time() + '切换到标清');
        $("b.line1bq.switchLine")[0].click();
        shotFlags |= 0x4;
    }
}

function closeExploreTip() {
    /*关闭「学前必读」弹窗*/
    $('.iconfont.iconguanbi').click()
}

function closePopUp() {
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
        console.log(
            date_time() + "[弹题测验] 为您跳过弹题测验，" +
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
        if (ProgressBar === progress_bar.children('.duration').text()) {
            console.log(date_time() + "[进度条] 检测到进度条已满。");
            var next_video = $(get_not_played()[0]);
            console.log(date_time() + "[自动播放] 播放：<" + next_video.text().replace('    ', ' ') + '>');
            next_video.click();
            shotFlags = 0x0; //切换视频的时候重置one_shot函数的flag
        }
    }
}

function pauseDetector() {
    /*暂停检测*/
    var play_Button = $(".playButton");
    if (play_Button.length > 0) {
        //点击暂停按钮，将继续播放视频
        play_Button.click();
        console.log(date_time() + "[暂停检测] 继续播放。");
        // play_Button.children[0].click();
    }

    /*卡顿检测*/
    var progress_bar = $('.nPlayTime');
    var ProgressBar = progress_bar.children('.currentTime').text();
    if ($("video").length > 0 && progress_bar.children().length > 0 && abnormalStuckDetectionLimit > 0) {
        if(ProgressBar!==lastProgressBar){
            // console.log(date_time()+ " " + ProgressBar + " " + lastProgressBar);
            if(stuckCount!==0){
                console.log(date_time() + "[卡顿检测] 已恢复播放，取消页面刷新计划。");
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
                console.log(date_time() + "[卡顿检测] 即将刷新页面…… " + stuckCount + "/" + abnormalStuckDetectionLimit);
            }
        }
        lastProgressBar = ProgressBar;
    }
}

function copyEnabler() {
    // 强制复制
    if(document.onselectstart !== null){
        console.log('强制复制');
        document.oncontextmenu = null;
        document.onpaste = null;
        document.oncopy = null;
        document.oncut = null;
        document.onselectstart = null;
    }
}

function mainLoop() {
    if(window.location.href.indexOf("onlineexamh5new.zhihuishu.com") !== -1){
        copyEnabler();
    }
    else if(window.location.href.indexOf("") !== -1){
        one_shot();
        closeExploreTip();
        closePopUp();
        progressBarMonitor();
        pauseDetector();
    }
}

function config_button_inject() {
    if ($(".newListTest").length > 0) {
        console.log($(".newListTest"));
        $(".newListTest").append('<li class="homeworkExam"><a onclick="onConfig();" id="myConfBtn"><em class="iconfont iconbaizhoumoshi-gengduo"></em><div>脚本设置</div></a></li>')
        $("#myConfBtn").on("click", onConfig);
    }
}

function onConfig() {
    GM_config.open();
}

(function () {
    'use strict';
    window.onload = window.setInterval(mainLoop, timeInterval);
    GM_config.init(myConfig);
    //GM_config.open();
    window.setTimeout(config_button_inject, 3000);
    console.log(date_time() + "[智慧树助手] 启动成功。");
})();

// el-popup-parent--hidden 弹题
