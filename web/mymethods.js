//my methods
var myFileName = "Default";

function getNumberOfPages(){
  return PDFViewerApplication.pagesCount;
}

function getCurrentPage(){
  return PDFViewerApplication.page;
}

function getMyPdf(arg) {

  PDFViewerApplication.open(arg);
}

function resetView()
{
  //this doesn't currently seem to do anything, I have asked how to clear the exsiting pdf on the google group
  PageView.pageViewReset();
}

function downloadMyPdf(arg)
{
  myFileName = arg;
  printDownload = false;
  PDFViewerApplication.download();
}

function printMyPdf()
{
  //instead of using the pdf.js, simply open the existing pdf in a new tab and then call print using the browsers built in viewer
  console.log("Test");
  printDownload = true;
  PDFViewerApplication.download();
}

function setStartPage(arg){
  //startPage = arg;
}

function toggleSide()
{
  //this.classList.toggle('toggled');
  outerContainer.classList.add('sidebarMoving');
  outerContainer.classList.toggle('sidebarOpen');
  PDFViewerApplication.sidebarOpen = outerContainer.classList.contains('sidebarOpen');
  PDFViewerApplication.renderHighestPriority();
}

function makeFullScreen()
{
  PresentationMode.enter();
  window.CADView_PDFViewController.pdfViewer.isFullScreen = true;
}

function exitFullScreen()
{
  PresentationMode.exit();
  window.CADView_PDFViewController.pdfViewer.isFullScreen = false;
}

function disableScrolling()
{
  document.getElementById("viewerContainer").style.overflow = "hidden";   
  window.CADView_PDFViewController.pdfViewer.isScrollEnabled = false;
}

function enableScrolling()
{
  document.getElementById("viewerContainer").style.overflow = "auto";   
  window.CADView_PDFViewController.pdfViewer.isScrollEnabled = true;
}
