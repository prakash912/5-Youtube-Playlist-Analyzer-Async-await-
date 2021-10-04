
const puppeteer=require('puppeteer');
const pdf=require('pdfkit')
const fs=require('fs')

let link='https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq'

let cTab;
(async function(){
    try{
        let browserOpen=puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:['--start-maximized']
        })
        let browserInstance=await browserOpen
        let allTabsArr=await browserInstance.pages()
        cTab=allTabsArr[0]
        await cTab.goto(link)
        await cTab.waitForSelector('h1#title')
        let name=await cTab.evaluate(function(select){return document.querySelector(select).innerText},'h1#title')
        
        let allData=await cTab.evaluate(getData,'#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer')
        console.log(name, allData.noOfVideos,allData.noOfViews)

        let TotalVideos=allData.noOfVideos.split(" ")[0]
        console.log(TotalVideos)
    
        let currentVideos=await getCVideosLength()
        console.log(currentVideos)

       while(TotalVideos-currentVideos>=20){
         await scrollToBottom()
         currentVideos=await getCVideosLength()
       } 

      
       let finalList=await getStats()
       let pdfDoc=new pdf
       pdfDoc.pipe(fs.createWriteStream('playlist.pdf'))
       pdfDoc.text(JSON.stringify(finalList))
       pdfDoc.end()
       
       
       


    }catch(error){
        console.log(error)
    }
})()

function getData(selector){
    let allElems=document.querySelectorAll(selector)
    let noOfVideos=allElems[0].innerText
    let noOfViews=allElems[1].innerText
    return{
        noOfVideos,
        noOfViews
    }
}


async function getCVideosLength(){
     let length=await cTab.evaluate(getLength,'#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
     return length
}

function getLength(durationSelect){
    let durationElem=document.querySelectorAll(durationSelect)
    return durationElem.length
}

async function scrollToBottom(){
    await cTab.evaluate(goToBottom)
    function goToBottom(){
        window.scrollBy(0,window.innerHeight)
    }
}


async function getStats(){
    let list = cTab.evaluate(getNameAndDuration,"#video-title","#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer")
    return list
}


function getNameAndDuration(videoSelector,durationSelector){
    let videoElem=document.querySelectorAll(videoSelector)
    let duraElem=document.querySelectorAll(durationSelector)
    let currentList=[]

    for(let i=0;i<duraElem.length;i++){
        let videoTitle=videoElem[i].innerText
        let duration=duraElem[i].innerText
        currentList.push({
            videoTitle,duration
        })
        
    }
    return currentList
}