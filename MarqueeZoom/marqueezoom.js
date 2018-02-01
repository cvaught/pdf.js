//(function () {
  var marqueeZoom = {
    btnMarqueeZoom: null,
    isActive: false,
    canvasContainers: [],
    fCanvases: [],
    pageIndex: null,
    startPoint: null,
    zoomSelection: null,

    initialize: function () {
      document.addEventListener("pagerendered", this.onPageRendered.bind(this), true);
      this.btnMarqueeZoom = document.getElementById("marqueeZoom");
      this.btnMarqueeZoom.addEventListener("click", this.onMarqueeZoomClick.bind(this));
    },

    activate: function () {
      for (var i = 0; i < this.canvasContainers.length; i++) {
        var container = this.canvasContainers[i];
        container && container.classList.add("active");
      }

      this.btnMarqueeZoom.classList.add("toggled");
    },

    deactivate: function () {
      for (var i = 0; i < this.canvasContainers.length; i++) {
        var container = this.canvasContainers[i];
        container && container.classList.remove("active");
      }

      this.btnMarqueeZoom.classList.remove("toggled");
    },

    zoomArea: function (point1, point2) {
      var TOOLBAR_HEIGHT = 32;
      var SCROLLBAR_WIDTH = 18;
      var PAGE_BORDER_HEIGHT = 9;

      var zoomWidth = Math.abs(point1.x - point2.x);
      var zoomHeight = Math.abs(point1.y - point2.y);

      if (zoomWidth === 0 || zoomHeight == 0) {
        return;
      }

      var scaleX = (window.innerWidth - SCROLLBAR_WIDTH) / zoomWidth;
      var scaleY = (window.innerHeight - SCROLLBAR_WIDTH - TOOLBAR_HEIGHT) / zoomHeight;
      var scale = Math.min(scaleX, scaleY);

      PDFViewerApplication.pdfViewer.currentScale *= scale;

      var x = Math.min(point1.x, point2.x) * scale;
      var y = Math.min(point1.y, point2.y) * scale;

      function getPosition(elem, cont) {
        var top = 0, left = 0;
        while (elem !== cont) {
          top = top + parseFloat(elem.offsetTop);
          left = left + parseFloat(elem.offsetLeft);
          elem = elem.offsetParent;
        }

        return {top: Math.round(top), left: Math.round(left)}
      }

      var pageContainers = document.querySelectorAll("div.page");
      var pageContainer = pageContainers[this.pageIndex];
      var viewerContainer = document.getElementById("viewerContainer");
      var canvasPosition = getPosition(pageContainer, viewerContainer);
      viewerContainer.scrollTop = canvasPosition.top + y + PAGE_BORDER_HEIGHT;
      viewerContainer.scrollLeft = canvasPosition.left + x;
    },

    onMarqueeZoomClick: function () {
      this.isActive = !this.isActive;

      if (this.isActive) {
        this.activate();
      } else {
        this.deactivate();
      }
    },

    onPageRendered: function (e) {
      var pageNumber = e.detail.pageNumber;
      var pageIndex = pageNumber - 1;

      var pageContainer = e.target;
      var pdfCanvas = pageContainer.querySelector(".canvasWrapper canvas");
      
      var ctx = pdfCanvas.getContext('2d', { alpha: false });
      var outputScale = this.getOutputScale(ctx);
      
      var width = pdfCanvas.getAttribute("width") / outputScale.sx;
      var height = pdfCanvas.getAttribute("height") / outputScale.sy;

      var zoomCanvasContainer = document.createElement("div");
      zoomCanvasContainer.className = "zoomCanvasContainer";

      zoomCanvasContainer.setAttribute("width", width);
      zoomCanvasContainer.setAttribute("height", height);
      zoomCanvasContainer.dataset.pageNumber = pageNumber;

      var zoomCanvas = document.createElement("canvas");
      zoomCanvas.setAttribute("width", width);
      zoomCanvas.setAttribute("height", height);

      zoomCanvasContainer.appendChild(zoomCanvas);
      pageContainer.appendChild(zoomCanvasContainer);

      this.canvasContainers[pageIndex] = zoomCanvasContainer;
      var fCanvas = new fabric.Canvas(zoomCanvas);
      fCanvas.uniScaleTransform = true;
      fCanvas.selection = false;
      fCanvas.on("mouse:down", this.onCanvasMouseDown.bind(this));
      fCanvas.on("mouse:up", this.onCanvasMouseUp.bind(this));
      fCanvas.on("mouse:move", this.onCanvasMouseMove.bind(this));

      this.fCanvases[pageIndex] = fCanvas;
    },
    
    getOutputScale: function (ctx) {
      var devicePixelRatio = window.devicePixelRatio || 1;
      var backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
      var pixelRatio = devicePixelRatio / backingStoreRatio;
      return {
        sx: pixelRatio,
        sy: pixelRatio,
        scaled: pixelRatio !== 1
      };
    },

    onCanvasMouseDown: function (o) {
      if (!this.isActive) {
        return;
      }

      var zoomCanvasContainer = o.e.target.parentNode.parentNode;
      var pageNumber = zoomCanvasContainer.dataset.pageNumber;
      this.pageIndex = pageNumber - 1;
      var fCanvas = this.fCanvases[this.pageIndex];
      this.startPoint = fCanvas.getPointer(o.e);

      this.zoomSelection = new fabric.Rect({
        left: this.startPoint.x,
        top: this.startPoint.y,
        width: 0,
        height: 0,
        selectable: false,
        stroke: "#98A1E2",
        fill: "#98A1E2",
        opacity: 0.3
      });

      fCanvas.add(this.zoomSelection);
    },

    onCanvasMouseUp: function () {
      if (!this.isActive) {
        return;
      }

      this.isActive = false;
      this.deactivate();

      var point1 = {
        x: this.zoomSelection.left,
        y: this.zoomSelection.top
      };

      var point2 = {
        x: this.zoomSelection.left + this.zoomSelection.width,
        y: this.zoomSelection.top + this.zoomSelection.height
      };

      this.zoomArea(point1, point2);

      var fCanvas = this.fCanvases[this.pageIndex];
      fCanvas.clear();
      fCanvas.renderAll();
      this.startPoint = null;
      this.zoomSelection = null;
    },

    onCanvasMouseMove: function (o) {
      var zoomCanvasContainer = o.e.target.parentNode.parentNode;
      var pageNumber = zoomCanvasContainer.dataset.pageNumber;

      if (!this.isActive || !this.startPoint || this.pageIndex !== (pageNumber - 1)) {
        return;
      }

      var fCanvas = this.fCanvases[this.pageIndex];
      var point = fCanvas.getPointer(o.e);

      var width = Math.abs(this.startPoint.x - point.x);
      var height = Math.abs(this.startPoint.y - point.y);
      var left = Math.min(this.startPoint.x, point.x);
      var top = Math.min(this.startPoint.y, point.y);
      this.zoomSelection.set({
        left: left,
        top: top,
        width: width,
        height: height
      });
      fCanvas.renderAll();
    }
  };

  function marqueeZoomLoad() {
    if (typeof PDFViewerApplication === "object" && PDFViewerApplication.initialized) {
      marqueeZoom.initialize();
    } else {
      setTimeout(marqueeZoomLoad, 20);
    }
  }

  document.addEventListener("DOMContentLoaded", marqueeZoomLoad);
//})();
