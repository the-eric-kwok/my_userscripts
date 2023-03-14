// ==UserScript==
// @name         简书净化
// @namespace    http://github.com/the-eric-kwok/
// @version      0.1
// @description  简书移除热门故事、广告
// @author       EricKwok
// @match        *://www.jianshu.com/p/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setInterval(() => {
        document.querySelectorAll('._1Prj5h').forEach(e=>{
            e.remove();
        });
        document.querySelectorAll('._2OwGUo').forEach(e=>{
            e.remove();
        });
        document.querySelectorAll('.adad_container').forEach(e=>{
            e.remove();
        });
        document.querySelectorAll('._11TSfs').forEach(e=>{
            e.remove();
        });
    }, 1000);
    // Your code here...
})();
