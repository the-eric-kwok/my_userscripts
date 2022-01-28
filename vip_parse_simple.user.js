// ==UserScript==
// @name         视频网站 VIP 解析简化版
// @description  解析腾讯视频等视频网站 VIP 资源，仅注入最小的内容，无替换播放器功能，以求更大的兼容性
// @antifeature  此脚本会导航用户到第三方解析站点进行解析，第三方解析站点可能会包含广告。
// @namespace    https://github.com/the-eric-kwok/my_userscripts
// @grant        none
// @version      1.0
// @author       EricKwok
// @run-at       document-idle
// @homepage     https://github.com/the-eric-kwok/my_userscripts
// @supportURL   https://github.com/the-eric-kwok/my_userscripts/issues
// =======================================
// @include      *://*v.qq.com/x*
// @include      *://m.v.qq.com/play.html*
// @include      *://*.youku.com/v*
// @include      *://*m.youku.com/*
// @include      *://*.iqiyi.com/v_*
// @include      *://*.iqiyi.com/w_*
// @include      *://*.iqiyi.com/a_*
// @include      *://*.iq.com/play/*
// @include      *://*.le.com/ptv/vplay/*
// @include      *://m.le.com/vplay*
// @include      *://*.mgtv.com/b/*
// @include      *://*tv.sohu.com/*
// @include      *://*film.sohu.com/album/*
// @include      *://m.bilibili.com*
// @include      *://*.bilibili.com/bangumi/play/*
// @include      *://*.pptv.com/show/*
// =======================================
// @exclude      *://*.eggvod.cn/*
// @exclude      *://*.xixicai.top/*
// @exclude      *://17kyun.com/*
// ==/UserScript==

/**
 * 在元素内注入超链接
 * @param {HTMLElem} elem 要注入复制按钮的页面元素
 * @param {String} title 超链接标题
 * @param {String} href 超链接 url
 * @param {String} className 复制按钮的自定义 className
 * @param {String} style 复制按钮的自定义 style
 * @param {String} injectAt 注入位置，默认为 beforeend，可选的值为：beforebegin、afterbegin、beforeend、afterend
 * @param {Boolean} spaceLeading 将用于间隔的空格插入到开头
 * @returns {Boolean} 如果执行完成则返回 true，否则返回 false
 */
function addSuperLink(elem, title, href, className = "", style = "", injectAt = "beforeend", spaceLeading = false) {
    if (!elem) {
        return false;
    }
    let id = parseInt(Math.random() * 1000);
    let superLink = `${spaceLeading ? "&nbsp;&nbsp;" : ""}<a id="btn${id}" href="${href}" target="_blank" class="${className}" style="${style}">${title}</a>${spaceLeading ? "" : "&nbsp;&nbsp;"}`
    elem.insertAdjacentHTML(injectAt, superLink);
    return true;
}

let removeAdFunctionMap = {
    // 此处为移除广告、诱导按钮的函数
    b23m: function () {
        document.querySelectorAll(".fe-ui-open-app-btn").forEach(elem => elem.remove());
    },
    b23: function () {
        document.querySelectorAll(".pay-bar").forEach(elem => elem.remove());
    },
    vqqm: function () {
        document.querySelectorAll(".at-app-banner--button").forEach(elem => elem.remove());
    },
    vqq: function () {
        document.querySelectorAll(".mod_vip_sidebar").forEach(elem => elem.remove());
        document.querySelectorAll(".ft_cell_vcoin").forEach(elem => elem.remove());
        document.querySelectorAll(".ft_cell_feedback").forEach(elem => elem.remove());
        document.querySelectorAll(".btn_search_hot").forEach(elem => elem.remove());
    },
    iqiyim: function () {
        document.querySelector(".link-continue").click();
        document.querySelectorAll(".m-iqylink-guide").forEach(elem => elem.remove());
    },
    iqiyi: function () {
        document.querySelectorAll(".qy-scroll-anchor").forEach(elem => elem.remove());
        document.querySelectorAll(".qy-player-side-op").forEach(elem => elem.remove());
        document.querySelectorAll(".dolby").forEach(elem => elem.remove());
    },
    youkum: function () {
        document.querySelectorAll(".Corner-container").forEach(elem => elem.remove());
        document.querySelectorAll(".h5-detail-guide").forEach(elem => elem.remove());
        document.querySelectorAll(".h5-detail-vip-guide").forEach(elem => elem.remove());
    },
    youku: function () {
        document.querySelectorAll(".qr-wrap").forEach(elem => elem.remove());
    },
    lem: function () {
        document.querySelectorAll(".leappMore1").forEach(elem => elem.remove());
        document.querySelectorAll(".gamePromotionTxt").forEach(elem => elem.remove());
        document.querySelectorAll(".leappMore1").forEach(elem => elem.remove());
    },
    le: function () {
        document.querySelectorAll(".open_vip").forEach(elem => elem.remove());
        document.querySelectorAll(".QR_code").forEach(elem => elem.remove());
        document.querySelectorAll(".vipTabBanner").forEach(elem => elem.remove());
    },
    mgtvm: function () {
        document.querySelectorAll(".vip-popover").forEach(elem => elem.remove());
        document.querySelectorAll(".mg-app-swip").forEach(elem => elem.remove());
        document.querySelectorAll(".mgui-btn-nowelt").forEach(elem => elem.remove());
    },
    mgtv: function () {
        document.querySelectorAll(".vip-button").forEach(elem => elem.remove());
        document.querySelectorAll(".openvip").forEach(elem => elem.remove());
        document.querySelectorAll(".pclient").forEach(elem => elem.remove());
    },
    sohutvm: function () {
        document.querySelectorAll(".btn-xz-app").forEach(elem => elem.remove());
        document.querySelectorAll(".actv-banner").forEach(elem => elem.remove());
        document.querySelectorAll(".btn-new-hy").forEach(elem => elem.remove());
        document.querySelectorAll(".film_footer").forEach(elem => elem.remove());

    },
    sohutv: function () {
        document.querySelectorAll(".join_vip").forEach(elem => elem.remove());
        document.querySelectorAll(".hd-fBox-vip").forEach(elem => elem.remove());
        document.querySelectorAll(".j-yunyingwei").forEach(elem => elem.remove());
        document.querySelectorAll(".item-ifox").forEach(elem => elem.remove());
        document.querySelectorAll(".item-app").forEach(elem => elem.remove());
    },
    sohufilm: function () {
        document.querySelectorAll(".J_act_operation").forEach(elem => elem.remove());
    },
    pptvm: function () {
        document.querySelectorAll(".pp-m-diversion-fix").forEach(elem => elem.remove());
        document.querySelectorAll(".foot_app").forEach(elem => elem.remove());
        document.querySelectorAll(".pp-m-diversion-popup").forEach(elem => elem.remove());
        document.querySelectorAll("#ppmob-detail-picswiper").forEach(elem => elem.remove());
        document.querySelectorAll(".cms-vip").forEach(elem => elem.remove());
        document.querySelectorAll(".advView-two").forEach(elem => elem.remove());
    },
    pptv: function () {
        document.querySelectorAll(".operate-space").forEach(elem => elem.remove());
        document.querySelectorAll(".adv-space").forEach(elem => elem.remove());
        document.querySelectorAll(".vip").forEach(elem => elem.remove());
        document.querySelectorAll(".cms-er-icon-vip").forEach(elem => elem.remove());
        document.querySelectorAll(".cms-vip").forEach(elem => elem.remove());
        document.querySelectorAll(".advView-two").forEach(elem => elem.remove());
    },
}

let injectFunctionMap = {
    // 此处列明每个站点如何注入一个超链接，然后交由主函数内的循环来遍历和注入
    b23m: function (url, title) {
        let elem = document.querySelector(".ep-info-pre");
        addSuperLink(elem, title, url, null, "font-size:14px;color:#fb7299");
    },
    b23: function (url, title) {
        let playerElem = document.querySelector(".media-info");
        addSuperLink(playerElem, title, url, null, "font-size:14px;color:#fb7299", "beforebegin");
    },
    vqqm: function (url, title) {
        let elem = document.querySelector(".video_title");
        addSuperLink(elem, title, url, null, null, "beforebegin");
    },
    vqq: function (url, title) {
        let elem = document.querySelector(".video_base._base");
        addSuperLink(elem, title, url, null, null, "beforebegin");
    },
    iqiyim: function (url, title) {
        let elem = document.querySelector(".videoInfoFold-data");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforebegin");
    },
    iqiyi: function (url, title) {
        let elem = document.querySelector(".qy-player-title");
        addSuperLink(elem, title, url, null, "color: hsla(0,0%,100%,.7);", "beforebegin");
    },
    youkum: function (url, title) {
        let elem = document.querySelector(".brief-info-box");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforebegin");
    },
    youku: function (url, title) {
        let elem = document.querySelector("#left-title-content-wrap");
        addSuperLink(elem, title, url, null, "font-size:14px;");
    },
    lem: function (url, title) {
        let elem = document.querySelector(".j-videofrom");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforeend", true);
    },
    le: function (url, title) {
        let elem = document.querySelector(".briefIntro_tit");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforebegin");
    },
    mgtvm: function (url, title) {
        let elem = document.querySelector(".hd");
        addSuperLink(elem, title, url, null, "font-size:14px;color:white;", "beforebegin", true);
    },
    mgtv: function (url, title) {
        let elem = document.querySelector(".title");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforeend", true);
    },
    sohutvm: function (url, title) {
        let elem = document.querySelector(".twinfo_iconwrap");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforebegin");
    },
    sohutv: function (url, title) {
        let elem = document.querySelector(".showname");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforeend", true);
    },
    sohufilm: function (url, title) {
        let elem = document.querySelector(".player-top-info-name > h2");
        addSuperLink(elem, title, url, null, "font-size:14px;color:white;", "beforeend", true);
    },
    pptvm: function (url, title) {
        let elem = document.querySelector(".video_title");
        addSuperLink(elem, title, url, null, "font-size:14px;", "beforebegin");
    },
    pptv: function (url, title) {
        let elem = document.querySelector(".programinfo > h1");
        addSuperLink(elem, title, url, null, "font-size:14px;color:white;", "beforeend", true);
    },
};

(function () {
    'use scrict';
    let juheUrlList = [
        "https://www.eggvod.cn/jxjx.php?lrspm=27188611&zhm_jx=",
        "https://www.xixicai.top/mov/s/?sv=3&url=",
        "https://17kyun.com/api.php?url=",
    ];
    /*
    // 备用解析节点，当聚合节点挂掉后可启用
    let vqqList = [
        "https://z1.m1907.cn/?jx=",
        "https://vip.parwix.com:4433/player/?url=",
        "https://jx.parwix.com:4433/player/?url=",
        "https://jx.aidouer.net/?url=",
        "https://vip.bljiex.com/?v=",
        "https://jx.618g.com/?url=",
        "https://www.gai4.com/?url=",
        "https://www.mtosz.com/m3u8.php?url=",
        "https://www.8090g.cn/?url=",
        "https://okjx.cc/?url=",
        "https://api.okjx.cc:3389/jx.php?url=",
    ];
    let lecomList = [
        "https://z1.m1907.cn/?jx=",
        "https://vip.parwix.com:4433/player/?url=",
        "https://jx.parwix.com:4433/player/?url=",
        "https://vip.bljiex.com/?v=",
        "https://lecurl.cn/?url=",
        "https://okjx.cc/?url=",
        "https://api.okjx.cc:3389/jx.php?url=",
    ];
    */
    let videoUrl = location.href;
    let site = "";
    if (videoUrl.includes("m.bilibili.com")) {
        site = "b23m";
    } else if (videoUrl.includes("bilibili.com")) {
        site = "b23";
    } else if (videoUrl.includes("m.v.qq.com")) {
        site = 'vqqm';
    } else if (videoUrl.includes("v.qq.com")) {
        site = "vqq";
    } else if (videoUrl.includes("m.iqiyi.com")) {
        site = "iqiyim"
    } else if (videoUrl.includes("iqiyi.com")) {
        site = "iqiyi";
    } else if (videoUrl.includes("m.youku.com")) {
        site = "youkum"
    } else if (videoUrl.includes("youku.com")) {
        site = "youku";
    } else if (videoUrl.includes("m.le.com")) {
        site = "lem";
    } else if (videoUrl.includes("le.com")) {
        site = "le";
    } else if (videoUrl.includes("m.mgtv.com")) {
        site = "mgtvm";
    } else if (videoUrl.includes("mgtv.com")) {
        site = "mgtv";
    } else if (videoUrl.includes("m.tv.sohu.com")) {
        site = "sohutvm";
    } else if (videoUrl.includes("tv.sohu.com")) {
        site = "sohutv";
    } else if (videoUrl.includes("film.sohu.com")) {
        site = "sohufilm";
    } else if (videoUrl.includes("m.pptv.com")) {
        site = "pptvm";
    } else if (videoUrl.includes("pptv.com")) {
        site = "pptv";
    }
    window.setInterval(function () { removeAdFunctionMap[site](); }, 500);
    window.setTimeout(function () {
        for (let i = 0; i < juheUrlList.length; i++) {
            let url = juheUrlList[i];
            injectFunctionMap[site](url + videoUrl, ` 聚合解析 ${i + 1} `)
        }
    }, 3000);
})();