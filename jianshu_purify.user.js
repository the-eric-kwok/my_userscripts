// ==UserScript==
// @name         简书净化
// @namespace    http://github.com/the-eric-kwok/
// @version      0.2
// @description  简书移除热门故事、广告
// @author       EricKwok
// @match        *://www.jianshu.com/p/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let setNewTask = (ms) => setTimeout(() => {
        let ads = [
            ...document.querySelectorAll('._1Prj5h'),
            ...document.querySelectorAll('._2OwGUo'),
            ...document.querySelectorAll('.adad_container'),
            ...document.querySelectorAll('._11TSfs'),
            ...document.querySelectorAll("body > div:nth-child(15)"),
            ...document.querySelectorAll("body > div:nth-child(16)"),
            ...document.querySelectorAll("body > div:nth-child(17)"),
            ...document.querySelectorAll("body > div:nth-child(18)"),
        ];
        ads.forEach(e=>{
            e.remove();
        });
		    setNewTask(ads.length > 0 ? 100 : 1000);
    }, ms);
	  setNewTask(100);
})();