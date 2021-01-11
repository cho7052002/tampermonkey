// ==UserScript==
// @name         아카라이브 이미지 미리보기 개선
// @namespace    아카라이브
// @version      1.3
// @description  아카라이브 이미지 미리보기 좆같은 것 ㅇㅈ? ㅇㅇㅈ 이미지 강제로 크게 만들어버리기~
// @updateUrl    https://raw.githubusercontent.com/cho7052002/tampermonkey/main/arcalive_preview.js
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
1.3:
    최적화
    updateUrl 추가
*/

(function() {
    'use strict';
    let popupPreviewSize = 300;
    let debug = false;
    let throttleInterval = 100;


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
            lolog(previewCount + 'expected ' + previewCount + ' but ' + elements.length + ', failed!');
            setTimeout(() => {imgSrcUpdate(previewCount)}, 100);
            return;
        }
        elements.forEach(i => {
            lolog(i.getAttribute('data-lazy-src'));
            //data-lazy-src for firefox support
            if(i.getAttribute('data-lazy-src') === null) {
                i.src = i.getAttribute('src').replaceAll('?type=list', '');
            } else {
                i.src = i.getAttribute('data-lazy-src').replaceAll('?type=list', '');
                i.setAttribute('data-lazy-src', i.src);
            }
        });
    }

    let oldLeft;
    let oldNavBottom;
    let isPreviousPopup = window.innerWidth - document.querySelector('article').getBoundingClientRect().right - 75 < popupPreviewSize;
    function previewResize() {
        let previewElements = document.querySelectorAll('.vrow-preview');

        let left = window.innerWidth - document.querySelector('article').getBoundingClientRect().right - 75;
        let isPopup = window.innerWidth - document.querySelector('article').getBoundingClientRect().right - 75 < popupPreviewSize;
        lolog('left: ' + left);
        lolog('oldLeft: ' + oldLeft + '\n' +
              'left: ' + left);
        //set preview position to above the board list
        if(isPopup) {
            if(!isPreviousPopup) {
                previewElements.forEach(i => {
                    i.style.position = 'absolute';
                    i.style.width = popupPreviewSize + 'px';
                    i.style.height = popupPreviewSize + 'px';
                    i.style.right = '';
                    i.style.top = 'calc(-' + popupPreviewSize + 'px - 15px)';
                });
                lolog('popup preview called');
            } else {
                lolog('popup preview skipped');
            }
        } else {
            //set preview position to right
            let navBottom = document.querySelector('.navbar-wrapper').getBoundingClientRect().bottom;
            navBottom = navBottom > 0 ? navBottom : 0;
            lolog('oldNavBottom: ' + oldNavBottom + '\n' +
                      'navBottom: ' + navBottom + '\n')
            if(oldNavBottom != navBottom || oldLeft != left) {
                document.querySelectorAll('.vrow-preview').forEach(i => {
                    i.style.position = 'fixed';
                    i.style.width = left + 'px';
                    i.style.height = 'calc(100vh - ' + navBottom + 'px)';
                    i.style.right = '0px';
                    i.style.top = navBottom + 'px';
                });
                lolog('right preview called');
            }else {
                lolog('right preview skipped');
            }
            oldNavBottom = navBottom;
        }
        oldLeft = left;
        isPreviousPopup = isPopup;
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
