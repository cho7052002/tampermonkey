// ==UserScript==
// @name         아카라이브 이미지 미리보기 개선
// @namespace    아카라이브
// @version      1.2
// @description  아카라이브 이미지 미리보기 좆같은 것 ㅇㅈ? ㅇㅇㅈ 이미지 강제로 크게 만들어버리기~
// @author       ggumdori
// @match        http*://*.arca.live/b/*
// @match        http*://arca.live/b/*
// @grant        none
// ==/UserScript==
/*
히스토리
0.1:
    헬로 월드!
1.1:
    파폭에서 동작하도록 수정
    이미지 크기가 목록 옆칸까지 되도록 수정
    화면크기 조절시 이미지 크기도 조절됨
1.2:
    이미지 미리보기를 오른쪽으로 옮김
    화면이 줄어들면 기존 이미지 보기처럼 바뀌고, 크기는 3배, 고해상도

*/

(function() {
    'use strict';
    let targetSize = 300;

    let debug = false;
    function lolog(o) {
        if(debug) {
            console.log(o);
        }
    }

    let THROTTLE;
    let throttleFunction = function (func, delay) {
        if (THROTTLE) {
            return
        }
        THROTTLE = setTimeout(function () {
            func()
            THROTTLE = undefined;
        }, delay)
    }

    function imgSrcUpdate(previewCount) {
        let elements = document.querySelectorAll('.vrow-preview > img');
        if(elements.length != previewCount) {
            lolog(previewCount + 'expected but ' + elements.length + ', failed!');
            setTimeout(() => {imgSrcUpdate(previewCount)}, 100);
            return;
        }
        elements.forEach(i => {
            lolog(i.getAttribute('data-lazy-src'));
            if(i.getAttribute('data-lazy-src') === null) {
                i.src = i.getAttribute('src').replaceAll('?type=list', '');
            } else {
                i.src = i.getAttribute('data-lazy-src').replaceAll('?type=list', '');
                i.setAttribute('data-lazy-src', i.src);
            }
        });
    }

    function previewResize() {
        let previewElements = document.querySelectorAll('.vrow-preview');

        let left = window.innerWidth - document.querySelector('article').getBoundingClientRect().right - 75;

        console.log(left);

        if(left < 200) {
            previewElements.forEach(i => {
                i.style.position = 'absolute';
                i.style.width = targetSize + 'px';
                i.style.height = targetSize + 'px';
                i.style.right = '';
                i.style.top = 'calc(-' + targetSize + 'px - 15px)';
            })
            return;
        }

        let navBottom = document.querySelector('.navbar-wrapper').getBoundingClientRect().bottom;
        navBottom = navBottom > 0 ? navBottom : 0;
        document.querySelectorAll('.vrow-preview').forEach(i => {
            i.style.position = 'fixed';
            i.style.width = left + 'px';
            i.style.height = 'calc(100vh - ' + navBottom + 'px)';
            i.style.right = '0px';
            i.style.top = navBottom + 'px';
        })
    }

    let previewCount = document.querySelectorAll('.vrow-preview').length;
    imgSrcUpdate(previewCount);
    previewResize();
    window.addEventListener('resize', () => {
        throttleFunction(previewResize, 100);
    });
    window.addEventListener('scroll', () => {
        throttleFunction(previewResize, 100);
    });
})();