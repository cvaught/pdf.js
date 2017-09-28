var isWinChrome = (function () {
  // http://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
  var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS"),
    isFirefox = winNav.userAgent.toLowerCase().indexOf('firefox') > -1;

  if (navigator.appVersion.indexOf("Win") !== -1 && !isOpera && !isIEedge)
  {
    if (isIOSChrome) {
      return false;
    } else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc.") {
      return true;
    } else if (isFirefox) {
      // the extension requires at least firefox version 50.0 or newer for native messaging
      // Symbol.instance was implemented in version 50
      if (typeof Symbol.hasInstance !== "undefined") {
        return true;
      }
    }
  }
  return false;
})();

  var OverlayManager = null;
  var SCROLLBAR_PADDING = 40;
  var VERTICAL_PADDING = 5;
  var MAX_AUTO_SCALE = 1.25;

  var AnnotationsToolbar = {
    opened: false,
    dragged: false,
    hotkeys: [],

    initialize: function (options) {
      this.toggleButton = options.toggleButton;
      this.toolbar = options.toolbar;
      this.title = options.title;
      this.closeButton = options.closeButton;
      this.pencilButton = options.pencilButton;
      this.lineButton = options.lineButton;
      this.arrowButton = options.arrowButton;
      this.rectangleButton = options.rectangleButton;
      this.ovalButton = options.ovalButton;
      this.textButton = options.textButton;
      this.highlighterButton = options.highlighterButton;
      this.selectButton = options.selectButton;
      this.deleteButton = options.deleteButton;
      this.attributesButton = options.attributesButton;
      this.saveButton = options.saveButton;

      this.attributesWindowName = options.attributesWindowName;
      this.attributesWindowCloseButton = options.attributesWindowCloseButton;
      this.attributesWindowUpdateButton = options.attributesWindowUpdateButton;
      this.attributesWindowColor = options.attributesWindowColor;
      this.attributesWindowLineWidth = options.attributesWindowLineWidth;
      this.attributesWindowLineWidthBlock = options.attributesWindowLineWidthBlock;
      this.attributesWindowLineType = options.attributesWindowLineType;
      this.attributesWindowLineTypeBlock = options.attributesWindowLineTypeBlock;
      this.attributesWindowFilled = options.attributesWindowFilled;
      this.attributesWindowFilledBlock = options.attributesWindowFilledBlock;
      this.attributesWindowFillColor = options.attributesWindowFillColor;
      this.attributesWindowFillColorBlock = options.attributesWindowFillColorBlock;
      this.attributesWindowTransparency = options.attributesWindowTransparency;

      //p
      this.hotkeys[80] = this.onPencilClick.bind(this);
      //l
      this.hotkeys[76] = this.onLineClick.bind(this);
      //a
      this.hotkeys[65] = this.onArrowClick.bind(this);
      //r
      this.hotkeys[82] = this.onRectangleClick.bind(this);
      //o
      this.hotkeys[79] = this.onOvalClick.bind(this);
      //t
      this.hotkeys[84] = this.onTextClick.bind(this);
      //h
      this.hotkeys[72] = this.onHighlighterClick.bind(this);
      //s
      this.hotkeys[83] = this.onSelectClick.bind(this);

      this.toggleButton.addEventListener("click", this.onToggleClick.bind(this));
      this.toolbar.addEventListener("mousedown", this.onToolbarMouseDown.bind(this));
      this.toolbar.addEventListener("mouseup", this.onToolbarMouseUp.bind(this));
      document.addEventListener("mousemove", this.onMouseMove.bind(this));
      document.addEventListener("keydown", this.onKeyDown.bind(this));
      window.addEventListener("resize", this.onResize.bind(this));

      this.closeButton.addEventListener("click", this.onCloseClick.bind(this));
      this.pencilButton.addEventListener("click", this.onPencilClick.bind(this));
      this.lineButton.addEventListener("click", this.onLineClick.bind(this));
      this.arrowButton.addEventListener("click", this.onArrowClick.bind(this));
      this.rectangleButton.addEventListener("click", this.onRectangleClick.bind(this));
      this.ovalButton.addEventListener("click", this.onOvalClick.bind(this));
      this.textButton.addEventListener("click", this.onTextClick.bind(this));
      this.highlighterButton.addEventListener("click", this.onHighlighterClick.bind(this));
      this.selectButton.addEventListener("click", this.onSelectClick.bind(this));
      this.deleteButton.addEventListener("click", this.onDeleteClick.bind(this));
      this.attributesButton.addEventListener("click", this.onAttributesClick.bind(this));
      this.saveButton.addEventListener("click", this.onSaveClick.bind(this));

      var options = [
        {text: "Solid", value: LINE_TYPE.SOLID},
        {text: "Dashed", value: LINE_TYPE.DASHED},
        {text: "Dotted", value: LINE_TYPE.DOTTED}
      ];

      for (var i = 0; i < options.length; i++) {
        var option = document.createElement("option");
        option.text = options[i].text;
        option.value = options[i].value;
        this.attributesWindowLineType.add(option);
      }

      $(this.attributesWindowColor).spectrum({
        showInput: true,
        showPalette: true,
        showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: "hex",
        palette: [
          ["#000000", "#434343"],
          ["#ff0000", "#1133cc"],
          ["#ffff00", "#33dd00"],
          ["#ff6622"]
        ]
      });

      $(this.attributesWindowFillColor).spectrum({
        showInput: true,
        showPalette: true,
        showSelectionPalette: true,
        maxSelectionSize: 10,
        preferredFormat: "hex",
        palette: [
          ["#000000", "#434343"],
          ["#ff0000", "#1133cc"],
          ["#ffff00", "#33dd00"],
          ["#ff6622"]
        ]
      });

      this.attributesWindowCloseButton.addEventListener("click", this.attributesWindowClose.bind(this));
      this.attributesWindowUpdateButton.addEventListener("click", this.attributesWindowUpdate.bind(this));
      OverlayManager.register(this.attributesWindowName, document.getElementById(this.attributesWindowName), this.attributesWindowClose.bind(this));

      this.loadPosition();

      AnnotationsController.initialize();
    },

    setActiveButton: function (btn) {
      var activeBtn = this.toolbar.querySelector(".active");
      if (activeBtn) {
        activeBtn.classList.remove("active");
      }

      if (btn) {
        btn.classList.add("active");
      }
    },

    open: function () {
      if (this.opened) {
        return;
      }
      this.opened = true;
      this.toggleButton.classList.add("toggled");
      this.toolbar.classList.remove("hidden");
    },

    close: function () {
      if (!this.opened) {
        return;
      }
      this.opened = false;
      this.toolbar.classList.add("hidden");
      this.toggleButton.classList.remove("toggled");

      AnnotationsController.setMode(DRAWING_MODE.NONE);
      this.setActiveButton();
    },

    updatePosition: function (x, y) {
      this.toolbar.style.left = x + "px";
      this.toolbar.style.top = y + "px";
      this.toolbar.style.bottom = "auto";
      this.toolbar.style.right = "auto";

      this.savePosition(x, y);
    },

    loadPosition: function () {
      var data = window.localStorage.getItem("annotationsToolbarPosition");
      if (data) {
        var pos = JSON.parse(data);
        this.updatePosition(pos[0], pos[1]);
        this.onResize();
      }
    },

    savePosition: function (x, y) {
      window.localStorage.setItem("annotationsToolbarPosition", JSON.stringify([x, y]));
    },

    attributesWindowClose: function () {
      OverlayManager.close(this.attributesWindowName);
    },

    attributesWindowUpdate: function () {
      var attr = {
        color: this.attributesWindowColor.value,
        lineWidth: +this.attributesWindowLineWidth.value,
        lineType: +this.attributesWindowLineType.value,
        fillColor: this.attributesWindowFilled.checked ? this.attributesWindowFillColor.value : "transparent",
        opacity: 1 - this.attributesWindowTransparency.value / 100
      };

      if (AnnotationsController.hasSelection()) {
        AnnotationsController.updateSelectionAttributes(attr);
      } else if (AnnotationsController.mode === DRAWING_MODE.HIGHLIGHTER) {
        AnnotationsController.updateHighlighterAttributes(attr);
      } else {
        AnnotationsController.updateAttributes(attr);
      }

      this.attributesWindowClose();
    },

    onToggleClick: function () {
      if (this.opened) {
        this.close();
      } else {
        this.open();
      }
    },

    onToolbarMouseDown: function (e) {
      if (e.which !== 1 || e.target !== this.title) {
        return;
      }

      this.dragged = true;

      if (typeof e.offsetX !== "undefined") {
        var toolbarStyles = getComputedStyle(this.toolbar);
        var leftBorderWidth = parseInt(toolbarStyles.getPropertyValue("border-left-width"), 10);
        var topBorderWidth = parseInt(toolbarStyles.getPropertyValue("border-top-width"), 10);
        this.dragOffsetX = e.offsetX + this.title.offsetLeft + leftBorderWidth;
        this.dragOffsetY = e.offsetY + this.title.offsetLeft + topBorderWidth;
      } else {
        this.dragOffsetX = e.layerX;
        this.dragOffsetY = e.layerY;
      }
    },

    onToolbarMouseUp: function (e) {
      if (e.which !== 1) {
        return;
      }

      this.dragged = false;
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
    },

    onMouseMove: function (e) {
      if (!this.dragged) {
        return;
      }

      var newX = e.clientX - this.dragOffsetX;
      var newY = e.clientY - this.dragOffsetY;

      this.updatePosition(newX, newY);
    },

    onKeyDown: function (e) {
      if (!this.opened) {
        return;
      }

      var keyCode = e.keyCode;
      switch (keyCode) {
        //ESC
        case 27:
          if (OverlayManager.active) {
            return;
          }

          if (AnnotationsController.mode === DRAWING_MODE.SELECT) {
            AnnotationsController.setMode(DRAWING_MODE.NONE);
            this.setActiveButton();
          } else {
            this.onSelectClick();
          }

          break;
      }

      if (!e.altKey) {
        return;
      }

      var handler = this.hotkeys[keyCode];
      if (handler) {
        handler();
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    },

    onResize: function () {
      if (this.toolbar.style.left !== "auto") {
        var toolbarX = parseInt(this.toolbar.style.left, 10) + this.toolbar.offsetWidth + 4;
        if (toolbarX > window.innerWidth) {
          this.toolbar.style.left = "auto";
          this.toolbar.style.right = "4px";
          window.localStorage.removeItem("annotationsToolbarPosition");
        }
      }

      if (this.toolbar.style.top !== "auto") {
        var toolbarY = parseInt(this.toolbar.style.top, 10) + this.toolbar.offsetHeight + 6;
        if (toolbarY > window.innerHeight) {
          this.toolbar.style.top = "auto";
          this.toolbar.style.bottom = "6px";
          window.localStorage.removeItem("annotationsToolbarPosition");
        }
      }
    },

    onCloseClick: function () {
      this.close();
    },

    onPencilClick: function () {
      this.setActiveButton(this.pencilButton);
      AnnotationsController.setMode(DRAWING_MODE.PENCIL);
    },

    onLineClick: function () {
      this.setActiveButton(this.lineButton);
      AnnotationsController.setMode(DRAWING_MODE.LINE);
    },

    onArrowClick: function () {
      this.setActiveButton(this.arrowButton);
      AnnotationsController.setMode(DRAWING_MODE.ARROW);
    },

    onRectangleClick: function () {
      this.setActiveButton(this.rectangleButton);
      AnnotationsController.setMode(DRAWING_MODE.RECTANGLE);
    },

    onOvalClick: function () {
      this.setActiveButton(this.ovalButton);
      AnnotationsController.setMode(DRAWING_MODE.OVAL);
    },

    onTextClick: function () {
      this.setActiveButton(this.textButton);
      AnnotationsController.setMode(DRAWING_MODE.TEXT);
    },

    onHighlighterClick: function () {
      this.setActiveButton(this.highlighterButton);
      AnnotationsController.setMode(DRAWING_MODE.HIGHLIGHTER);
    },

    onSelectClick: function () {
      this.setActiveButton(this.selectButton);
      AnnotationsController.setMode(DRAWING_MODE.SELECT);
    },

    onDeleteClick: function () {
      AnnotationsController.deleteSelection();
    },

    onAttributesClick: function () {
      OverlayManager.open(this.attributesWindowName).then((function () {
        var attr = AnnotationsController.getSelectionAttributes();
        if (!attr) {
          attr = AnnotationsController.mode === DRAWING_MODE.HIGHLIGHTER ? AnnotationsController.highlighterAttributes : AnnotationsController.attributes;
        }

        $(this.attributesWindowColor).spectrum("set", attr.color);

        if (typeof attr.lineWidth !== "undefined") {
          this.attributesWindowLineWidth.value = attr.lineWidth;
          this.attributesWindowLineWidthBlock.style.display = "table-row";
        } else {
          this.attributesWindowLineWidthBlock.style.display = "none";
        }

        if (typeof attr.lineType !== "undefined") {
          this.attributesWindowLineType.value = attr.lineType;
          this.attributesWindowLineTypeBlock.style.display = "table-row";
        } else {
          this.attributesWindowLineTypeBlock.style.display = "none";
        }

        if (typeof attr.fillColor !== "undefined") {
          if (attr.fillColor === "transparent") {
            this.attributesWindowFilled.checked = false;
            $(this.attributesWindowFillColor).spectrum("set", "#000000");
          }
          else {
            this.attributesWindowFilled.checked = true;
            $(this.attributesWindowFillColor).spectrum("set", attr.fillColor);
          }
          this.attributesWindowFilledBlock.style.display = "table-row";
          this.attributesWindowFillColorBlock.style.display = "table-row";
        } else {
          this.attributesWindowFilledBlock.style.display = "none";
          this.attributesWindowFillColorBlock.style.display = "none";
        }

        this.attributesWindowTransparency.value = 100 - attr.opacity * 100;
      }.bind(this)));
    },

    onSaveClick: function () {
      AnnotationsController.deleteSavedObjects();
      var content = AnnotationsController.getSVG();
      /*if (content[0]) {
       var svg_blob = new Blob([content[0]], {'type': "image/svg+xml"});
       var url = URL.createObjectURL(svg_blob);
       var svg_win = window.open(url, "svg_win");
       }*/

      // ensure some svg content exists
      var hasContent = function()
      {
        for (var i = 0; i < content.length; i++)
        {
          if (content[i])
            return true;
        }
        return false;
      }

      var a = window.CADView_PDFViewController;
      if (hasContent())
      {
        a.startAnimating();

        var worker = new Worker("../PDFAnnotations/uploader.js");
        worker.onmessage = function(event) {
          if (a != null)
          {
            var result = event.data;
            if (result.lastIndexOf('Error', 0) === 0)
            {
              a.displayMessage(result);
            }
            else
            {
              a.showAnnotationWindow(result, AnnotationsToolbar.dwgIdent);
            }
          }
        };
        worker.postMessage([content, this.dwgIdent, null, null, this.userIdent]);
      }
      else
      {
        if (a != null)
        {
          a.displayMessage("No annotations have been created.")
        }
        else
        {
          alert("No annotations have been created.");
        }
      }
    }
  };

  var DRAWING_MODE = {
    NONE: 0,
    PENCIL: 1,
    LINE: 2,
    ARROW: 3,
    RECTANGLE: 4,
    OVAL: 5,
    TEXT: 6,
    HIGHLIGHTER: 7,
    SELECT: 8
  };

  var LINE_TYPE = {
    SOLID: 0,
    DASHED: 1,
    DOTTED: 2
  };

  var CHANGE_TYPE = {
    ADD: 1,
    DELETE: 2,
    DELETE_GROUP: 3,
    POSITION_MODIFIED: 4,
    ATTRIBUTES_MODIFIED: 5,
    TEXT_MODIFIED: 6
  };

  var AnnotationsController = {
    canvasContainers: [],
    fCanvases: [],
    savePoints: [
      {fCanvasesObjects: []}
    ],
    currentSavePointIndex: 0,
    pdfFingerprint: "",
    mode: DRAWING_MODE.NONE,
    clipboard: [],
    attributes: {
      fillColor: "transparent",
      lineWidth: 4,
      lineType: LINE_TYPE.SOLID,
      color: "#FF0000",
      opacity: 1
    },
    highlighterAttributes: {
      color: "#FFFF00",
      lineWidth: 15,
      opacity: 0.5

    },
    isShapeDrawing: false,
    isPasteProcess: false,

    initialize: function () {
      document.addEventListener("pagerendered", this.onPageRendered.bind(this), true);
      document.addEventListener("keydown", this.onKeyDown.bind(this));

      document.getElementById("annotationsSavedObjectsLoad").addEventListener("click", this.onSavedObjectsLoadClick.bind(this));
      document.getElementById("annotationsSavedObjectsCancel").addEventListener("click", this.onSavedObjectsWindowClose.bind(this));
      document.getElementById("annotationsSavedObjectsClose").addEventListener("click", this.onSavedObjectsWindowClose.bind(this));
      OverlayManager.register("annotationsSavedObjects", document.getElementById("annotationsSavedObjects"), this.onSavedObjectsWindowClose.bind(this));

      this.loadAttributes();
      this.loadHighlighterAttributes();
      this.loadClipboard();
    },

    updateAttributes: function (attr) {
      for (var prop in attr) {
        if (this.attributes.hasOwnProperty(prop)) {
          this.attributes[prop] = attr[prop];
        }
      }

      if (this.mode === DRAWING_MODE.PENCIL) {
        this.setFreeDrawingBrush(this.attributes);
      }

      this.saveAttributes(this.attributes);
    },

    updateHighlighterAttributes: function (attr) {
      for (var prop in attr) {
        if (this.highlighterAttributes.hasOwnProperty(prop)) {
          this.highlighterAttributes[prop] = attr[prop];
        }
      }

      if (this.mode === DRAWING_MODE.HIGHLIGHTER) {
        this.setFreeDrawingBrush(this.highlighterAttributes);
      }

      this.saveHighlighterAttributes(this.highlighterAttributes);
    },

    setFreeDrawingBrush: function (settings) {
      var scale = PDFViewerApplication.pdfViewer.currentScale;
      var proportion = this.calcProportion();

      var color = fabric.Color.fromHex(settings.color.substring(1));
      color.setAlpha(settings.opacity);
      color = color.toRgba();
      this.each(this.fCanvases, function (fCanvas) {
        fCanvas.freeDrawingBrush.color = color;
        fCanvas.freeDrawingBrush.width = settings.lineWidth / proportion * scale;
      }, this);
    },

    hasSelection: function () {
      return this.each(this.fCanvases, function (fCanvas) {
        return fCanvas.getActiveObject() || fCanvas.getActiveGroup();
      });
    },

    getSelectionAttributes: function () {
      var getActiveObjectOfType = (function (fCanvases, types) {
        var result;
        this.each(fCanvases, function (fCanvas) {
          var selectedObject = fCanvas.getActiveObject();
          if (selectedObject && types.indexOf(selectedObject.type) !== -1) {
            result = selectedObject;
            return true;
          }
          var selectedGroup = fCanvas.getActiveGroup();
          if (selectedGroup) {
            this.each(selectedGroup.getObjects(), function (fObject) {
              if (types.indexOf(fObject.type) !== -1) {
                result = fObject;
                return true;
              }
            });
          }
        });
        return result;
      }).bind(this);

      var selectedObject = getActiveObjectOfType(this.fCanvases, ["rect", "ellipse"]) ||
        getActiveObjectOfType(this.fCanvases, ["line", "group"]) ||
        getActiveObjectOfType(this.fCanvases, ["path"]) ||
        getActiveObjectOfType(this.fCanvases, ["i-text"]);

      if (selectedObject) {
        if (selectedObject.type === "group") {
          selectedObject = selectedObject.item(0);
        }
        var proportion = this.calcProportion();
        switch (selectedObject.type) {
          case "path":
            return {
              lineWidth: selectedObject.realStrokeWidth,
              color: selectedObject.stroke,
              opacity: selectedObject.opacity
            };
          case "line":
            return {
              lineWidth: Math.round(selectedObject.strokeWidth * proportion),
              lineType: this.getLineType(selectedObject),
              color: selectedObject.stroke,
              opacity: selectedObject.opacity
            };
          case "rect":
          case "ellipse":
            return {
              fillColor: selectedObject.fill,
              lineWidth: Math.round(selectedObject.strokeWidth * proportion),
              lineType: this.getLineType(selectedObject),
              color: selectedObject.stroke,
              opacity: selectedObject.opacity
            };
          case "i-text":
            return {
              color: selectedObject.fill,
              opacity: selectedObject.opacity
            };
        }
      }
    },

    updateSelectionAttributes: function (attr) {
      var updateObjectAttributes = (function (fObject, attr) {
        var proportion = this.calcProportion();
        switch (fObject.type) {
          case "path":
            var scale = PDFViewerApplication.pdfViewer.currentScale;
            fObject.stroke = attr.color;
            fObject.realStrokeWidth = attr.lineWidth;
            fObject.strokeWidth = fObject.realStrokeWidth / proportion / ((fObject.scaleX + fObject.scaleY) / 2) * scale;
            fObject.opacity = attr.opacity;
            break;
          case "line":
            fObject.stroke = attr.color;
            fObject.strokeWidth = attr.lineWidth / proportion;
            fObject.strokeDashArray = this.calcStrokeDash(attr);
            fObject.opacity = attr.opacity;
            break;
          case "group":
            var line = fObject.item(0);
            line.stroke = attr.color;
            line.strokeWidth = attr.lineWidth / proportion;
            line.strokeDashArray = this.calcStrokeDash(attr);
            line.opacity = attr.opacity;
            var triangle = fObject.item(1);
            triangle.width = attr.lineWidth / proportion * 3;
            triangle.height = attr.lineWidth / proportion * 3;
            triangle.stroke = attr.color;
            triangle.strokeWidth = attr.lineWidth / proportion;
            triangle.fill = attr.color;
            triangle.opacity = attr.opacity;
            break;
          case "rect":
          case "ellipse":
            fObject.stroke = attr.color;
            fObject.strokeWidth = attr.lineWidth / proportion;
            fObject.fill = attr.fillColor;
            fObject.strokeDashArray = this.calcStrokeDash(attr);
            fObject.opacity = attr.opacity;
            break;
          case "i-text":
            fObject.fill = attr.color;
            fObject.opacity = attr.opacity;
            break;
        }
      }).bind(this);

      this.each(this.fCanvases, function (fCanvas) {
        var selectedObject = fCanvas.getActiveObject();
        if (selectedObject) {
          updateObjectAttributes(selectedObject, attr);
        }
        var selectedGroup = fCanvas.getActiveGroup();
        if (selectedGroup) {
          selectedGroup.forEachObject(function (fObject) {
            updateObjectAttributes(fObject, attr);
          });
        }

        if (selectedObject || selectedGroup) {
          fCanvas.renderAll();
          this.onObjectsChange(fCanvas, CHANGE_TYPE.ATTRIBUTES_MODIFIED);
        }
      }, this);
    },

    deleteSelection: function () {
      this.each(this.fCanvases, function (fCanvas) {
        var selectedObject = fCanvas.getActiveObject();
        if (selectedObject) {
          fCanvas.remove(selectedObject);
        }
        var selectedGroup = fCanvas.getActiveGroup();
        if (selectedGroup) {
          selectedGroup.forEachObject(function (fObject) {
            fCanvas.remove(fObject);
          });
          fCanvas.discardActiveGroup().renderAll();
        }
        if (selectedObject || selectedGroup) {
          this.onObjectsChange(fCanvas, CHANGE_TYPE.DELETE_GROUP);
        }
      });
    },

    clear: function () {
      this.each(this.fCanvases, function (fCanvas) {
        fCanvas.clear().renderAll();
        this.onObjectsChange(fCanvas, CHANGE_TYPE.DELETE_ALL);
      });
    },

    undo: function () {
      if (this.currentSavePointIndex < 1) {
        return;
      }
      var changedPageIndex = this.savePoints[this.currentSavePointIndex].pageIndex;
      this.currentSavePointIndex--;
      var currentSavePoint = this.savePoints[this.currentSavePointIndex];
      this.renderCanvas(this.fCanvases[changedPageIndex], currentSavePoint.fCanvasesObjects[changedPageIndex]);
    },

    redo: function () {
      if (this.currentSavePointIndex === this.savePoints.length - 1) {
        return;
      }
      this.currentSavePointIndex++;
      var changedPageIndex = this.savePoints[this.currentSavePointIndex].pageIndex;
      var currentSavePoint = this.savePoints[this.currentSavePointIndex];
      this.renderCanvas(this.fCanvases[changedPageIndex], currentSavePoint.fCanvasesObjects[changedPageIndex]);
    },

    copy: function () {
      if (!this.hasSelection()) {
        return;
      }

      this.clipboard = this.cloneSelectedObjects();
      this.saveClipboard(this.clipboard);
    },

    cut: function () {
      this.copy();
      this.deleteSelection();
    },

    paste: function () {
      if (!this.isPasteAvailable()) {
        return;
      }

      var fCanvas = this.fCanvases[PDFViewerApplication.pdfViewer.currentPageNumber - 1];
      this.deselect();

      var pastedfObjects = [];
      var objects = fCanvas.getObjects();
      var correctionValue = 20 * PDFViewerApplication.pdfViewer.currentScale;

      this.isPasteProcess = true;

      this.each(this.clipboard, function (fObject, ind) {
        this.cloneObjectTo(fObject, fCanvas.width, fCanvas.height, (function (newfObject) {
          addCorrection:
            do {
              for (var i = 0; i < objects.length; i++) {
                var object = objects[i];
                var isSameObject = newfObject.type === object.type &&
                  Math.abs(newfObject.top - object.top) < 1 &&
                  Math.abs(newfObject.left - object.left) < 1 &&
                  Math.abs(newfObject.width - object.width) < 1 &&
                  Math.abs(newfObject.height - object.height) < 1;

                if (isSameObject) {
                  newfObject.top += correctionValue;
                  newfObject.left += correctionValue;
                  continue addCorrection;
                }
              }
              break;
            } while (true);

          fCanvas.add(newfObject);

          pastedfObjects[ind] = newfObject;
          for (var j = 0; j < this.clipboard.length; j++) {
            if (typeof pastedfObjects[j] === "undefined") {
              return;
            }
          }

          this.isPasteProcess = false;
          this.onObjectsChange(fCanvas, CHANGE_TYPE.ADD, newfObject);

          if (pastedfObjects.length === 1) {
            fCanvas.setActiveObject(pastedfObjects[0]);
          } else {
            this.each(pastedfObjects, function (o) {
              o.set("active", true);
            });

            var group = new fabric.Group(pastedfObjects, {
              originX: "center",
              originY: "center"
            });

            group.canvas = fCanvas;

            fCanvas.setActiveGroup(group.setCoords()).renderAll();
          }
        }).bind(this));
      }, this);
    },

    isPasteAvailable: function () {
      return this.clipboard.length !== 0;
    },

    setMode: function (mode) {
      if (mode === this.mode) {
        return;
      }

      switch (mode) {
        case DRAWING_MODE.NONE:
          this.each(this.fCanvases, function (fCanvas) {
            fCanvas.isDrawingMode = false;
          });
          this.deactivateAnnotations();
          break;
        case DRAWING_MODE.PENCIL:
          this.activateAnnotations();
          this.each(this.fCanvases, function (fCanvas) {
            fCanvas.isDrawingMode = true;
          });
          this.setFreeDrawingBrush(this.attributes);
          break;
        case DRAWING_MODE.LINE:
        case DRAWING_MODE.ARROW:
        case DRAWING_MODE.RECTANGLE:
        case DRAWING_MODE.OVAL:
        case DRAWING_MODE.TEXT:
          this.activateAnnotations();
          this.each(this.fCanvases, function (fCanvas) {
            fCanvas.isDrawingMode = false;
          });
          this.each(this.fCanvases, function (fCanvas) {
            fCanvas.selection = false;
            fCanvas.forEachObject(function (o) {
              o.selectable = false;
            });
          });
          break;
        case DRAWING_MODE.HIGHLIGHTER:
          this.activateAnnotations();
          this.each(this.fCanvases, function (fCanvas) {
            fCanvas.isDrawingMode = true;
          });
          this.setFreeDrawingBrush(this.highlighterAttributes);
          break;
        case DRAWING_MODE.SELECT:
          this.activateAnnotations();
          this.each(this.fCanvases, function (fCanvas) {
            fCanvas.isDrawingMode = false;
          });
          this.each(this.fCanvases, function (fCanvas) {
            fCanvas.selection = true;
            fCanvas.forEachObject(function (o) {
              o.selectable = true;
            });
          });
          break;
      }

      this.deselect();
      this.mode = mode;
    },

    getSVG: function () {
      var result = [];
      var currentSavePoint = this.savePoints[this.currentSavePointIndex];
      this.each(currentSavePoint.fCanvasesObjects, function (fObjects, i) {
        if (!fObjects || !fObjects.length) {
          return;
        }

        var page = PDFViewerApplication.pdfViewer.getPageView(i);
        var width = (page.rotation === 0 || page.rotation === 180) ? page.width : page.height;
        var height = (page.rotation === 0 || page.rotation === 180) ? page.height : page.width;
        width /= page.scale;
        height /= page.scale;
        result[i] = this.generateSVG(fObjects, width, height);
      });
      return result;
    },

    generateSVG: function (fObjects, width, height) {
      var markup = [];
      markup.push(
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n',
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
        '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n',
        '<svg ',
        'xmlns="http://www.w3.org/2000/svg" ',
        'xmlns:xlink="http://www.w3.org/1999/xlink" ',
        'version="1.1" ',
        'width="', width, '" ',
        'height="', height, '" ',
        'viewBox="0 0 ', width, ' ', height, '" ',
        'xml:space="preserve">\n',
        '<desc>Created with Fabric.js ', fabric.version, '</desc>\n',
        '<defs>',
        fabric.createSVGFontFacesMarkup(fObjects),
        '</defs>\n'
      );

      this.each(fObjects, function (fObject) {
        markup.push(fObject.toSVG());
      });

      markup.push('</svg>');

      return markup.join('');
    },

    calcStrokeDash: function (attr) {
      var proportion = this.calcProportion();
      switch (attr.lineType) {
        case LINE_TYPE.SOLID:
          return;
        case LINE_TYPE.DASHED:
          return [attr.lineWidth / proportion * 5, attr.lineWidth / proportion * 5];
        case LINE_TYPE.DOTTED:
          return [attr.lineWidth / proportion, attr.lineWidth / proportion];
      }
    },

    calcProportion: function () {
      var pdfViewer = PDFViewerApplication.pdfViewer;
      var rotation = pdfViewer.pagesRotation;
      var firstPage = pdfViewer._pages[0];
      if (!firstPage) {
        return MAX_AUTO_SCALE;
      }
      var hPadding = (pdfViewer.isInPresentationMode || pdfViewer.removePageBorders) ? 0 : SCROLLBAR_PADDING;
      var vPadding = (pdfViewer.isInPresentationMode || pdfViewer.removePageBorders) ? 0 : VERTICAL_PADDING;
      var width = (rotation % 180 === 0) ? firstPage.width : firstPage.height;
      var height = (rotation % 180 === 0) ? firstPage.height : firstPage.width;
      var pageWidthScale = (screen.width - hPadding) / width * firstPage.scale;
      var pageHeightScale = (screen.height - vPadding) / height * firstPage.scale;
      var isLandscape = (width > height);
      var horizontalScale = isLandscape ? Math.min(pageHeightScale, pageWidthScale) : pageWidthScale;
      return Math.min(MAX_AUTO_SCALE, horizontalScale);
    },

    getLineType: function (fObject) {
      if (!fObject.strokeDashArray) {
        return LINE_TYPE.SOLID;
      } else if (fObject.strokeDashArray[0] === fObject.strokeWidth * 5) {
        return LINE_TYPE.DASHED;
      } else {
        return LINE_TYPE.DOTTED;
      }
    },

    activateAnnotations: function () {
      this.each(this.canvasContainers, function (container) {
        container.classList.add("active");
      });
    },

    deactivateAnnotations: function () {
      this.each(this.canvasContainers, function (container) {
        container.classList.remove("active");
      });
      this.deselect();
    },

    renderCanvas: function (fCanvas, fObjects) {
      fCanvas.off();
      fCanvas.clear();

      fCanvas.on("object:added", this.onITextAdded.bind(this));

      this.each(fObjects, function (fObject) {
        this.cloneObjectTo(fObject, fCanvas.width, fCanvas.height, function (newfObject) {
          fCanvas.add(newfObject);
        });
      });

      fCanvas.on("mouse:down", this.onCanvasMouseDown.bind(this));
      fCanvas.on("mouse:up", this.onCanvasMouseUp.bind(this));
      fCanvas.on("mouse:move", this.onCanvasMouseMove.bind(this));
      fCanvas.on("object:scaling", this.onObjectScaling.bind(this));

      fCanvas.on("object:added", this.onPathAdded.bind(this));
      fCanvas.on("object:added", this.onObjectAdded.bind(this));
      fCanvas.on("object:removed", this.onObjectRemoved.bind(this));
      fCanvas.on("object:modified", this.onObjectModified.bind(this));
      fCanvas.on("text:changed", this.onTextChanged.bind(this));
    },

    deselect: function () {
      this.each(this.fCanvases, function (fCanvas) {
        var objects = fCanvas.getObjects();
        this.each(objects, function (fObject) {
          if (fObject.type === "i-text" && fObject.isEditing) {
            fObject.exitEditing();
          }
        });

        fCanvas.deactivateAll().renderAll();
      });
    },

    hasSavedObjects: function (fingerprint) {
      var dataJson = window.localStorage.getItem("pdfAnnotationsObjects");
      if (dataJson) {
        var data = JSON.parse(dataJson);
        var allObjectsJson = data[fingerprint];
        if (!allObjectsJson) {
          return false;
        }
        for (var i = 0; i < allObjectsJson.length; i++) {
          if (allObjectsJson[i].length) {
            return true;
          }
        }
      }
      return false;
    },

    loadObjects: function (fingerprint) {
      var fCanvasesObjects = [];
      this.savePoints = [
        {fCanvasesObjects: fCanvasesObjects}
      ];

      var dataJson = window.localStorage.getItem("pdfAnnotationsObjects");
      if (dataJson) {
        var data = JSON.parse(dataJson);
        var allObjectsJson = data[fingerprint];
        this.each(allObjectsJson, function (objectsJson, index1) {
          fCanvasesObjects[index1] = [];
          this.each(objectsJson, function (object, index2) {
            var klass = fabric.util.getKlass(object.type);
            if (klass.async) {
              klass.fromObject(object, (function (fObject) {
                fCanvasesObjects[index1][index2] = fObject;
              }).bind(this));
            } else {
              fCanvasesObjects[index1][index2] = klass.fromObject(object);
            }
          }, this);
        }, this);

        this.each(this.fCanvases, function (fCanvas, index) {
          if (fCanvas) {
            this.renderCanvas(fCanvas, fCanvasesObjects[index]);
          }
        });
      }
    },

    loadAttributes: function () {
      var data = window.localStorage.getItem("pdfAnnotationsAttributes");
      if (data) {
        var attr = JSON.parse(data);
        this.updateAttributes(attr);
      } else {
        this.updateAttributes();
      }
    },

    loadHighlighterAttributes: function () {
      var data = window.localStorage.getItem("pdfAnnotationsHighlighterAttributes");
      if (data) {
        var attr = JSON.parse(data);
        this.updateHighlighterAttributes(attr);
      } else {
        this.updateHighlighterAttributes();
      }
    },

    loadClipboard: function () {
      var data = window.localStorage.getItem("pdfAnnotationsClipboard");
      if (data) {
        var objects = JSON.parse(data);
        this.each(objects, function (object, i) {
          var klass = fabric.util.getKlass(object.type);
          if (klass.async) {
            klass.fromObject(object, (function (fObject) {
              this.clipboard[i] = fObject;
            }).bind(this));
          } else {
            this.clipboard[i] = klass.fromObject(object);
          }
        }, this);
      }
    },

    saveObjects: function (fingerprint, allfObjects) {
      var objectsJson = [];
      this.each(allfObjects, function (fObjects, index) {
        objectsJson[index] = [];
        this.each(fObjects, function (fObject) {
          objectsJson[index].push(fObject.toObject());
        });
      }, this);

      var dataJson = window.localStorage.getItem("pdfAnnotationsObjects");
      var data = dataJson ? JSON.parse(dataJson) : {};
      data[fingerprint] = objectsJson;
      window.localStorage.setItem("pdfAnnotationsObjects", JSON.stringify(data));
    },

    deleteSavedObjects: function (fingerprint) {
      fingerprint = fingerprint || this.pdfFingerprint;
      var dataJson = window.localStorage.getItem("pdfAnnotationsObjects");
      if (dataJson) {
        var data = JSON.parse(dataJson);
        delete data[fingerprint];
        window.localStorage.setItem("pdfAnnotationsObjects", JSON.stringify(data));
      }
    },

    saveAttributes: function (attr) {
      window.localStorage.setItem("pdfAnnotationsAttributes", JSON.stringify(attr));
    },

    saveHighlighterAttributes: function (attr) {
      window.localStorage.setItem("pdfAnnotationsHighlighterAttributes", JSON.stringify(attr));
    },

    saveClipboard: function (clipboard) {
      var clipboardJson = [];
      this.each(clipboard, function (item) {
        clipboardJson.push(item.toObject());
      });

      window.localStorage.setItem("pdfAnnotationsClipboard", JSON.stringify(clipboardJson));
    },

    cloneObjects: function (fCanvas) {
      var result = [];
      var fObjects = fCanvas.getObjects();

      this.each(fObjects, function (fObject, i) {
        this.cloneObjectFrom(fObject, fCanvas.width, fCanvas.height, fCanvas.scale, fCanvas.rotation, function (newfObject) {
          result[i] = newfObject;
        });
      }, this);

      return result;
    },

    cloneSelectedObjects: function () {
      var result = [];
      this.each(this.fCanvases, function (fCanvas) {
        var selectedObject = fCanvas.getActiveObject();
        if (selectedObject) {
          this.cloneObjectFrom(selectedObject, fCanvas.width, fCanvas.height, fCanvas.scale, fCanvas.rotation, function (newfObject) {
            result.push(newfObject);
          });
        }
        var selectedGroup = fCanvas.getActiveGroup();
        if (selectedGroup) {
          selectedGroup.forEachObject((function (fObject) {
            this.cloneObjectFrom(fObject, fCanvas.width, fCanvas.height, fCanvas.scale, fCanvas.rotation, function (newfObject) {
              result.push(newfObject);
            });
          }).bind(this));
        }
      }, this);
      return result;
    },

    cloneObjectFrom: function (fObject, width, height, scale, rotation, callback) {
      if (fObject.type === "path" || fObject.type === "group") {
        fObject.clone((function (newObject) {
          if (fObject.originalTop) {
            newObject.top = fObject.originalTop;
          }
          if (fObject.originalLeft) {
            newObject.left = fObject.originalLeft;
          }

          newObject.top /= scale;
          newObject.left /= scale;
          newObject.scaleX /= scale;
          newObject.scaleY /= scale;
          //hack for group clone bug
          if (newObject.type === "group" && newObject.size() === 2) {
            newObject.item(0).fill = fObject.item(0).fill;
            newObject.item(0).opacity = fObject.item(0).opacity;
            newObject.item(1).fill = fObject.item(1).fill;
            newObject.item(1).opacity = fObject.item(1).opacity;
          }
          if (newObject.type === "path") {
            newObject.realStrokeWidth = fObject.realStrokeWidth;
          }

          this.rotateWithPage(newObject, width / scale, height / scale, 360 - rotation);
          callback(newObject);
        }).bind(this));
        return;
      }

      var newObject = fObject.clone();
      if (fObject.group && fObject.originalTop) {
        newObject.top = fObject.originalTop;
      }
      if (fObject.group && fObject.originalLeft) {
        newObject.left = fObject.originalLeft;
      }
      newObject.top /= scale;
      newObject.left /= scale;


      switch (newObject.type) {
        case "line":
        case "rect":
          if (newObject.scaleX === 1 && scale !== 1) {
            newObject.width /= scale;
          }

          if (newObject.scaleY === 1 && scale !== 1) {
            newObject.height /= scale;
          }

          newObject.scaleX = 1;
          newObject.scaleY = 1;
          break;
        case "ellipse":
          if (newObject.scaleX === 1 && scale !== 1) {
            newObject.rx /= scale;
            newObject.width /= scale;
          }

          if (newObject.scaleY === 1 && scale !== 1) {
            newObject.ry /= scale;
            newObject.height /= scale;
          }

          newObject.scaleX = 1;
          newObject.scaleY = 1;
          break;
        case "i-text":
          newObject.scaleX /= scale;
          newObject.scaleY /= scale;
          break;
      }

      this.rotateWithPage(newObject, width / scale, height / scale, 360 - rotation);
      callback(newObject);
    },

    cloneObjectTo: function (fObject, width, height, callback) {
      var scale = PDFViewerApplication.pdfViewer.currentScale;
      var rotation = PDFViewerApplication.pdfViewer.pagesRotation;

      switch (fObject.type) {
        case "group":
        case "path":
          fObject.clone((function (newObject) {
            newObject.top *= scale;
            newObject.left *= scale;
            newObject.scaleX *= scale;
            newObject.scaleY *= scale;
            //hack for group clone bug
            if (newObject.type === "group" && newObject.size() === 2) {
              newObject.item(0).fill = fObject.item(0).fill;
              newObject.item(0).opacity = fObject.item(0).opacity;
              newObject.item(1).fill = fObject.item(1).fill;
              newObject.item(1).opacity = fObject.item(1).opacity;
            }
            if (newObject.type === "path") {
              newObject.realStrokeWidth = fObject.realStrokeWidth;
            }

            this.rotate(newObject, width, height, rotation);
            callback(newObject);
          }).bind(this));
          break;
        case "line":
        case "rect":
        case "ellipse":
          var newObject = fObject.clone();
          newObject.top *= scale;
          newObject.left *= scale;
          newObject.scaleX = scale;
          newObject.scaleY = scale;
          this.rotate(newObject, width, height, rotation);
          callback(newObject);
          break;
        case "i-text":
          var newObject = fObject.clone();
          newObject.top *= scale;
          newObject.left *= scale;
          newObject.scaleX *= scale;
          newObject.scaleY *= scale;
          this.rotate(newObject, width, height, rotation);
          callback(newObject);
          break;
      }
    },

    rotate: function (fObject, width, height, rotation) {
      var newTop = fObject.top;
      var newLeft = fObject.left;
      var newAngle = (fObject.angle + rotation) % 360;

      switch (rotation) {
        case 90:
          newTop = fObject.left;
          newLeft = width - fObject.top;
          break;
        case 180:
          newTop = height - fObject.top;
          newLeft = width - fObject.left;
          break;
        case 270:
          newTop = height - fObject.left;
          newLeft = fObject.top;
          break;
      }

      fObject.top = newTop;
      fObject.left = newLeft;
      fObject.angle = newAngle;
    },

    rotateWithPage: function (fObject, width, height, rotation) {
      var newTop = fObject.top;
      var newLeft = fObject.left;
      var newAngle = (fObject.angle + rotation) % 360;

      switch (rotation) {
        case 90:
          newTop = fObject.left;
          newLeft = height - fObject.top;
          break;
        case 180:
          newTop = height - fObject.top;
          newLeft = width - fObject.left;
          break;
        case 270:
          newTop = width - fObject.left;
          newLeft = fObject.top;
          break;
      }

      fObject.top = newTop;
      fObject.left = newLeft;
      fObject.angle = newAngle;
    },

    each: function (items, callback, self) {
      if (!items) {
        return;
      }

      self = self || this;

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item) {
          var result = callback.call(self, item, i);
          if (result) {
            return true;
          }
        }
      }
    },

    onPageRendered: function (e) {
      if (PDFViewerApplication.pdfDocument.fingerprint !== this.pdfFingerprint) {
        this.fCanvases = [];
        this.savePoints = [
          {fCanvasesObjects: []}
        ];
        this.currentSavePointIndex = 0;
      }

      var pageNumber = e.detail.pageNumber;
      var pageIndex = pageNumber - 1;

      var pageContainer = e.target;
      var pdfCanvas = pageContainer.querySelector(".canvasWrapper canvas");
      var width = pdfCanvas.getAttribute("width");
      var height = pdfCanvas.getAttribute("height");

      var annotationCanvasContainer = document.createElement("div");
      annotationCanvasContainer.className = "annotationsCanvasContainer";
      if (this.mode !== DRAWING_MODE.NONE) {
        annotationCanvasContainer.classList.add("active");
      }
      annotationCanvasContainer.setAttribute("width", width);
      annotationCanvasContainer.setAttribute("height", height);
      annotationCanvasContainer.dataset.pageNumber = pageNumber;
      annotationCanvasContainer.addEventListener("contextmenu", this.onContextMenu.bind(this));

      var annotationCanvas = document.createElement("canvas");
      annotationCanvas.setAttribute("width", width);
      annotationCanvas.setAttribute("height", height);

      annotationCanvasContainer.appendChild(annotationCanvas);
      pageContainer.appendChild(annotationCanvasContainer);

      this.canvasContainers[pageIndex] = annotationCanvasContainer;
      var fCanvas = new fabric.Canvas(annotationCanvas);
      fCanvas.uniScaleTransform = true;
      fCanvas.selection = this.mode === DRAWING_MODE.SELECT;
      fCanvas.scale = PDFViewerApplication.pdfViewer.currentScale;
      fCanvas.rotation = PDFViewerApplication.pdfViewer.pagesRotation;

      fCanvas.isDrawingMode = this.mode === DRAWING_MODE.PENCIL || this.mode === DRAWING_MODE.HIGHLIGHTER;

      var currentSavePoint = this.savePoints[this.currentSavePointIndex];
      this.renderCanvas(fCanvas, currentSavePoint.fCanvasesObjects[pageIndex]);
      this.fCanvases[pageIndex] = fCanvas;

      if (this.mode === DRAWING_MODE.PENCIL) {
        this.setFreeDrawingBrush(this.attributes);
      } else if (this.mode === DRAWING_MODE.HIGHLIGHTER) {
        this.setFreeDrawingBrush(this.highlighterAttributes);
      }

      if (PDFViewerApplication.pdfDocument.fingerprint !== this.pdfFingerprint) {
        this.pdfFingerprint = PDFViewerApplication.pdfDocument.fingerprint;
        if (this.hasSavedObjects(this.pdfFingerprint)) {
          OverlayManager.open("annotationsSavedObjects");
        }
      }
    },

    onCanvasMouseDown: function (o) {
      var scale = PDFViewerApplication.pdfViewer.currentScale;
      var proportion = this.calcProportion();

      var annotationCanvasContainer = o.e.target.parentNode.parentNode;
      var pageNumber = annotationCanvasContainer.dataset.pageNumber;
      var pageIndex = pageNumber - 1;
      var fCanvas = this.fCanvases[pageIndex];
      var point = fCanvas.getPointer(o.e);

      if ((Date.now() - this.finishEditingIText) < 100) {
        fCanvas.setActiveObject(this.editingIText);
        return;
      }

      switch (this.mode) {
        case DRAWING_MODE.LINE:
          this.shape = new fabric.Line([point.x, point.y, point.x, point.y], {
            scaleX: scale,
            scaleY: scale,
            stroke: this.attributes.color,
            strokeWidth: this.attributes.lineWidth / proportion,
            strokeDashArray: this.calcStrokeDash(this.attributes),
            opacity: this.attributes.opacity,
            selectable: false
          });
          break;
        case DRAWING_MODE.ARROW:
          this.shape = new fabric.Group([], {selectable: false});
          break;
        case DRAWING_MODE.RECTANGLE:
          this.shape = new fabric.Rect({
            left: point.x,
            top: point.y,
            width: 0,
            height: 0,
            scaleX: scale,
            scaleY: scale,
            fill: this.attributes.fillColor,
            stroke: this.attributes.color,
            strokeWidth: this.attributes.lineWidth / proportion,
            strokeDashArray: this.calcStrokeDash(this.attributes),
            opacity: this.attributes.opacity,
            selectable: false
          });
          break;
        case DRAWING_MODE.OVAL:
          this.shape = new fabric.Ellipse({
            left: point.x,
            top: point.y,
            width: 0,
            height: 0,
            scaleX: scale,
            scaleY: scale,
            rx: 0,
            ry: 0,
            fill: this.attributes.fillColor,
            stroke: this.attributes.color,
            strokeWidth: this.attributes.lineWidth / proportion,
            strokeDashArray: this.calcStrokeDash(this.attributes),
            opacity: this.attributes.opacity,
            selectable: false
          });
          break;
        case DRAWING_MODE.TEXT:
          if (o.target && o.target.type === "i-text" && o.target === fCanvas.getActiveObject()) {
            return;
          }

          var text = new fabric.IText("Enter text", {
            left: point.x,
            top: point.y,
            scaleX: scale,
            scaleY: scale,
            fill: this.attributes.color,
            fontSize: 24 / proportion,
            opacity: this.attributes.opacity
          });
          fCanvas.add(text);
          fCanvas.setActiveObject(text);
          text.enterEditing();
          text.selectAll();
          return;
        default:
          return;
      }

      fCanvas.add(this.shape);
      this.pressPoint = point;
      this.isShapeDrawing = true;
    },

    onCanvasMouseUp: function (o) {
      if (!this.isShapeDrawing) {
        return;
      }

      var annotationCanvasContainer = o.e.target.parentNode.parentNode;
      var pageNumber = annotationCanvasContainer.dataset.pageNumber;
      var pageIndex = pageNumber - 1;
      var fCanvas = this.fCanvases[pageIndex];
      fCanvas.remove(this.shape);
      fCanvas.add(this.shape);
      this.shape = null;
      this.isShapeDrawing = false;
      fCanvas.renderAll();
    },

    onCanvasMouseMove: function (o) {
      var target = o.e.target;
      if (!target || target.tagName !== "CANVAS") {
        return;
      }

      if (!this.isShapeDrawing) {
        return;
      }

      var scale = PDFViewerApplication.pdfViewer.currentScale;

      var annotationCanvasContainer = target.parentNode.parentNode;
      var pageNumber = annotationCanvasContainer.dataset.pageNumber;
      var pageIndex = pageNumber - 1;
      var fCanvas = this.fCanvases[pageIndex];
      var point = fCanvas.getPointer(o.e);

      switch (this.mode) {
        case DRAWING_MODE.LINE:
          var width = Math.abs(this.pressPoint.x - point.x);
          var height = Math.abs(this.pressPoint.y - point.y);

          if (o.e.ctrlKey) {
            var x1 = Math.min(point.x, this.pressPoint.x);
            var y1 = Math.min(point.y, this.pressPoint.y);
            var x2 = x1 + width / scale;
            var y2 = y1 + height / scale;

            if (width > height) {
              y1 = this.pressPoint.y;
              y2 = this.pressPoint.y;
            } else {
              x1 = this.pressPoint.x;
              x2 = this.pressPoint.x;
            }

            this.shape.set({
              x1: x1,
              y1: y1,
              x2: x2,
              y2: y2
            });
          } else {
            var leftPoint = (point.x < this.pressPoint.x) ? point : this.pressPoint;
            var rightPoint = (point.x < this.pressPoint.x) ? this.pressPoint : point;
            if (leftPoint.y < rightPoint.y) {
              this.shape.set({
                x1: leftPoint.x,
                y1: leftPoint.y,
                x2: leftPoint.x + width / scale,
                y2: leftPoint.y + height / scale
              });
            } else {
              this.shape.set({
                x1: leftPoint.x,
                y1: rightPoint.y + height / scale,
                x2: leftPoint.x + width / scale,
                y2: rightPoint.y
              });
            }
          }

          break;
        case DRAWING_MODE.ARROW:
          var proportion = this.calcProportion();
          var line = new fabric.Line([this.pressPoint.x, this.pressPoint.y, this.pressPoint.x, this.pressPoint.y], {
            left: 0,
            top: 0,
            stroke: this.attributes.color,
            strokeWidth: this.attributes.lineWidth / proportion,
            strokeDashArray: this.calcStrokeDash(this.attributes),
            opacity: this.attributes.opacity,
            originX: "center",
            originY: "center"
          });

          if (point.x < this.pressPoint.x) {
            line.x1 = (this.pressPoint.x - point.x) / scale;
            line.x2 = 0;
          } else {
            line.x1 = 0;
            line.x2 = (point.x - this.pressPoint.x) / scale;
          }

          if (point.y < this.pressPoint.y) {
            line.y1 = (this.pressPoint.y - point.y) / scale;
            line.y2 = 0;
          } else {
            line.y1 = 0;
            line.y2 = (point.y - this.pressPoint.y) / scale;
          }

          line.width = Math.abs(point.x - this.pressPoint.x) / scale;
          line.height = Math.abs(point.y - this.pressPoint.y) / scale;

          var dx = line.x2 - line.x1;
          var dy = line.y2 - line.y1;
          var angle = Math.atan2(dy, dx);
          angle *= 180 / Math.PI;
          angle += 90;

          var triangle = new fabric.Triangle({
            left: line.x2 - line.width / 2,
            top: line.y2 - line.height / 2,
            width: this.attributes.lineWidth / proportion * 3,
            height: this.attributes.lineWidth / proportion * 3,
            angle: angle,
            fill: this.attributes.color,
            stroke: this.attributes.color,
            strokeWidth: this.attributes.lineWidth / proportion,
            opacity: this.attributes.opacity,
            originX: "center",
            originY: "center"
          });

          fCanvas.remove(this.shape);

          this.shape = new fabric.Group([line, triangle], {
            left: Math.min(this.pressPoint.x, point.x),
            top: Math.min(this.pressPoint.y, point.y),
            scaleX: scale,
            scaleY: scale,
            selectable: false
          });

          fCanvas.add(this.shape);
          break;
        case DRAWING_MODE.RECTANGLE:
          var width = Math.abs(this.pressPoint.x - point.x);
          var height = Math.abs(this.pressPoint.y - point.y);

          if (o.e.ctrlKey) {
            var minSize = Math.min(width, height);
            var left = (this.pressPoint.x < point.x) ? this.pressPoint.x : this.pressPoint.x - minSize;
            var top = (this.pressPoint.y < point.y) ? this.pressPoint.y : this.pressPoint.y - minSize;
            this.shape.set({
              left: left,
              top: top,
              width: minSize / scale,
              height: minSize / scale
            });
          } else {
            var left = Math.min(this.pressPoint.x, point.x);
            var top = Math.min(this.pressPoint.y, point.y);
            this.shape.set({
              left: left,
              top: top,
              width: width / scale,
              height: height / scale
            });
          }
          break;
        case DRAWING_MODE.OVAL:
          var width = Math.abs(this.pressPoint.x - point.x);
          var height = Math.abs(this.pressPoint.y - point.y);

          if (o.e.ctrlKey) {
            var minSize = Math.min(width, height);
            var left = (this.pressPoint.x < point.x) ? this.pressPoint.x : this.pressPoint.x - minSize;
            var top = (this.pressPoint.y < point.y) ? this.pressPoint.y : this.pressPoint.y - minSize;
            this.shape.set({
              left: left,
              top: top,
              width: minSize / scale,
              height: minSize / scale,
              rx: minSize / scale / 2,
              ry: minSize / scale / 2
            });
          } else {
            var left = Math.min(this.pressPoint.x, point.x);
            var top = Math.min(this.pressPoint.y, point.y);
            this.shape.set({
              left: left,
              top: top,
              width: width / scale,
              height: height / scale,
              rx: width / scale / 2,
              ry: height / scale / 2
            });
          }
          break;
        default:
          return;
      }

      fCanvas.renderAll();
    },

    onKeyDown: function (e) {
      if (!AnnotationsToolbar.opened) {
        return;
      }

      var keyCode = e.keyCode;
      switch (keyCode) {
        //DEL
        case 46:
          this.deleteSelection();
          break;
        //y
        case 89:
          if (e.ctrlKey) {
            this.redo();
          }
          break;
        //Z
        case 90:
          if (e.ctrlKey) {
            this.undo();
          }
          break;
        //c
        case 67:
          if (e.ctrlKey) {
            this.copy();
          }
          break;
        //x
        case 88:
          if (e.ctrlKey) {
            this.cut();
          }
          break;
        //v
        case 86:
          if (e.ctrlKey) {
            if (this.isPasteAvailable()) {
              AnnotationsToolbar.onSelectClick();
              this.paste();
            }
          }
          break;
      }
    },

    onContextMenu: function (e) {
      e.preventDefault();
    },

    onObjectScaling: function (o) {
      var scale = PDFViewerApplication.pdfViewer.currentScale;
      var proportion = this.calcProportion();

      var fCanvas = o.target.canvas;
      fCanvas.uniScaleTransform = !o.e.ctrlKey;
      var fObject = o.target;

      switch (fObject.type) {
        case "path":
          var width = fObject.realStrokeWidth / proportion / ((fObject.scaleX + fObject.scaleY) / 2) * scale;
          fObject.strokeWidth = width;
          break;
        case "line":
        case "rect":
          fObject.set({
            width: fObject.width * fObject.scaleX / scale,
            height: fObject.height * fObject.scaleY / scale,
            scaleX: scale,
            scaleY: scale
          });
          break;
        case "ellipse":
          fObject.set({
            rx: fObject.width * fObject.scaleX / scale / 2,
            ry: fObject.height * fObject.scaleY / scale / 2,
            scaleX: scale,
            scaleY: scale
          });
          break;
      }
    },

    onPathAdded: function (e) {
      var fObject = e.target;

      if (fObject.type === "path" && fObject.stroke.indexOf("rgba") === 0) {
        var color = fObject.stroke;
        color = fabric.Color.fromRgba(color);
        var opacity = color.getAlpha();
        color = "#" + color.toHex();
        fObject.stroke = color;
        fObject.opacity = opacity;
        fObject.realStrokeWidth = this.mode === DRAWING_MODE.PENCIL ? this.attributes.lineWidth : this.highlighterAttributes.lineWidth;
      }
    },

    onITextAdded: function (e) {
      var fObject = e.target;

      if (fObject.type === "i-text") {
        fObject.on("editing:exited", this.onITextEditingExited);
      }
    },

    onITextEditingExited: function () {
      AnnotationsController.editingIText = this;
      AnnotationsController.finishEditingIText = Date.now();
    },

    onObjectAdded: function (e) {
      this.onObjectsChange(e.target.canvas, CHANGE_TYPE.ADD, e.target);
    },

    onObjectRemoved: function (e) {
      this.onObjectsChange(e.target.canvas, CHANGE_TYPE.DELETE, e.target);
    },

    onObjectModified: function (e) {
      this.onObjectsChange(e.target.canvas, CHANGE_TYPE.POSITION_MODIFIED, e.target);
    },

    onTextChanged: function (e) {
      this.onObjectsChange(e.target.canvas, CHANGE_TYPE.TEXT_MODIFIED, e.target);
    },

    onObjectsChange: function (fCanvas, changeType, fObject) {
      var annotationCanvasContainer = fCanvas.wrapperEl.parentNode;
      var pageNumber = annotationCanvasContainer.dataset.pageNumber;
      var pageIndex = pageNumber - 1;

      if (changeType === CHANGE_TYPE.ADD && this.isPasteProcess) {
        return;
      }

      if (changeType === CHANGE_TYPE.DELETE) {
        if (this.isShapeDrawing) {
          this.savePoints.pop();
          this.currentSavePointIndex--;
        }
        return;
      } else {
        var fCanvasesObjects = [];
        this.each(this.fCanvases, function (fCanvas, i) {
          fCanvasesObjects[i] = this.cloneObjects(fCanvas);
        });

        var savePoint = {
          pageIndex: pageIndex,
          changeType: changeType,
          fObject: fObject,
          fCanvasesObjects: fCanvasesObjects
        };

        this.savePoints.length = this.currentSavePointIndex + 1;
        this.savePoints.push(savePoint);
        this.currentSavePointIndex++;

        this.saveObjects(this.pdfFingerprint, fCanvasesObjects);
      }
    },

    onSavedObjectsLoadClick: function () {
      this.loadObjects(this.pdfFingerprint);
      this.onSavedObjectsWindowClose();
      AnnotationsToolbar.open();
      AnnotationsToolbar.onSelectClick();
    },

    onSavedObjectsWindowClose: function () {
      OverlayManager.close("annotationsSavedObjects");
    }
  };

  function annotationsLoad() {
    if (typeof PDFViewerApplication === "object" && PDFViewerApplication.initialized) {
      OverlayManager = PDFViewerApplication.overlayManager;

      AnnotationsToolbar.initialize({
        toggleButton: document.getElementById("annotationsToolbarToggle"),
        toolbar: document.getElementById("annotationsToolbar"),
        title: document.getElementById("annotationsToolbarTitle"),
        closeButton: document.getElementById("annotationsToolbarClose"),
        pencilButton: document.getElementById("annotationsToolbarPencil"),
        lineButton: document.getElementById("annotationsToolbarLine"),
        arrowButton: document.getElementById("annotationsToolbarArrow"),
        rectangleButton: document.getElementById("annotationsToolbarRectangle"),
        ovalButton: document.getElementById("annotationsToolbarOval"),
        textButton: document.getElementById("annotationsToolbarText"),
        highlighterButton: document.getElementById("annotationsToolbarHighlighter"),
        selectButton: document.getElementById("annotationsToolbarSelect"),
        deleteButton: document.getElementById("annotationsToolbarDelete"),
        attributesButton: document.getElementById("annotationsToolbarAttributes"),
        saveButton: document.getElementById("annotationsToolbarSave"),
        attributesWindowName: "annotationsAttributesOverlay",
        attributesWindowColor: document.getElementById("annotationsAttributesColor"),
        attributesWindowLineWidth: document.getElementById("annotationsAttributesLineWidth"),
        attributesWindowLineWidthBlock: document.querySelectorAll("#annotationsAttributesOverlay .row")[1],
        attributesWindowLineType: document.getElementById("annotationsAttributesLineType"),
        attributesWindowLineTypeBlock: document.querySelectorAll("#annotationsAttributesOverlay .row")[2],
        attributesWindowFilled: document.getElementById("annotationsAttributesFilled"),
        attributesWindowFilledBlock: document.querySelectorAll("#annotationsAttributesOverlay .row")[3],
        attributesWindowFillColor: document.getElementById("annotationsAttributesFillColor"),
        attributesWindowFillColorBlock: document.querySelectorAll("#annotationsAttributesOverlay .row")[4],
        attributesWindowTransparency: document.getElementById("annotationsAttributesTransparency"),
        attributesWindowCloseButton: document.getElementById("annotationsAttributesClose"),
        attributesWindowUpdateButton: document.getElementById("annotationsAttributesUpdate")
      });
    }
    else {
      setTimeout(annotationsLoad, 20);
    }
  }

  document.addEventListener("DOMContentLoaded", annotationsLoad);

  function setUserIdentAndDwgIdent(usrId, dwgID)
  {
    AnnotationsToolbar.userIdent = usrId;
    AnnotationsToolbar.dwgIdent = dwgID;
  }



  var pdfAcrobatPrinter = {

    initialize: function (options) {
      this.extensionNotInstallWindowName = options.extensionNotInstallWindowName;
      this.extensionNotInstallCloseButton = options.extensionNotInstallCloseButton;
      this.extensionNotInstallDownloadButton = options.extensionNotInstallDownloadButton;
      this.extensionNotInstallCancelButton = options.extensionNotInstallCancelButton;
      this.hostAppNotInstallWindowName = options.hostAppNotInstallWindowName;
      this.hostAppNotInstallCloseButton = options.hostAppNotInstallCloseButton;
      this.hostAppNotInstallDownloadButton = options.hostAppNotInstallDownloadButton;
      this.hostAppNotInstallCancelButton = options.hostAppNotInstallCancelButton;
      this.acrobatNotInstallWindowName = options.acrobatNotInstallWindowName;
      this.acrobatNotInstallCloseButton = options.acrobatNotInstallCloseButton;
      this.acrobatNotInstallDownloadButton = options.acrobatNotInstallDownloadButton;
      this.acrobatNotInstallCancelButton = options.acrobatNotInstallCancelButton;
      this.pdfStartDownloadWindowName = options.pdfStartDownloadWindowName;
      this.pdfStartDownloadCloseButton = options.pdfStartDownloadCloseButton;
      this.pdfStartDownloadOkButton = options.pdfStartDownloadOkButton;
      this.printButton = options.printButton;
      this.downloadButton = options.downloadButton;

      this.extensionNotInstallCloseButton.addEventListener("click", this.extensionNotInstallWindowClose.bind(this));
      this.extensionNotInstallDownloadButton.addEventListener("click", this.onExtensionNotInstallDownloadClick.bind(this));
      this.extensionNotInstallCancelButton.addEventListener("click", this.extensionNotInstallWindowClose.bind(this));
      OverlayManager.register(this.extensionNotInstallWindowName, document.getElementById(this.extensionNotInstallWindowName), this.extensionNotInstallWindowClose.bind(this));

      this.hostAppNotInstallCloseButton.addEventListener("click", this.hostAppNotInstallWindowClose.bind(this));
      this.hostAppNotInstallDownloadButton.addEventListener("click", this.onHostAppNotInstallDownloadClick.bind(this));
      this.hostAppNotInstallCancelButton.addEventListener("click", this.hostAppNotInstallWindowClose.bind(this));
      OverlayManager.register(this.hostAppNotInstallWindowName, document.getElementById(this.hostAppNotInstallWindowName), this.hostAppNotInstallWindowClose.bind(this));

      this.acrobatNotInstallCloseButton.addEventListener("click", this.acrobatNotInstallWindowClose.bind(this));
      this.acrobatNotInstallDownloadButton.addEventListener("click", this.onAcrobatNotInstallDownloadClick.bind(this));
      this.acrobatNotInstallCancelButton.addEventListener("click", this.acrobatNotInstallWindowClose.bind(this));
      OverlayManager.register(this.acrobatNotInstallWindowName, document.getElementById(this.acrobatNotInstallWindowName), this.acrobatNotInstallWindowClose.bind(this));

      this.pdfStartDownloadCloseButton.addEventListener("click", this.pdfStartDownloadWindowClose.bind(this));
      this.pdfStartDownloadOkButton.addEventListener("click", this.pdfStartDownloadWindowClose.bind(this));
      OverlayManager.register(this.pdfStartDownloadWindowName, document.getElementById(this.pdfStartDownloadWindowName), this.pdfStartDownloadWindowClose.bind(this));


      window.addEventListener("message", this.onWindowMessage.bind(this), false);

      this.downloadButton.addEventListener("click", this.open.bind(this));
      this.printButton.addEventListener("click", this.print.bind(this));
      document.addEventListener("keydown", this.onKeyDown.bind(this));
    },

    open: function () {
      var pdfUrl = PDFViewerApplication.pdfDocumentProperties.url;
      var absoluteUrl = this.getAbsoluteUrl(pdfUrl);
      var fileName = /[^\/]*$/.exec(pdfUrl)[0];

      var data = {
        command: "openPdf",
        url: absoluteUrl,
        fileName: fileName,
        callbackEventName: "PDF_ANNOTATIONS_PRINTER"
      }
      this.sendMessage(data);
    },

    openURL: function (pdfUrl, fileName) {
      var absoluteUrl = this.getAbsoluteUrl(pdfUrl);
      var data = {
        command: "openPdf",
        url: absoluteUrl,
        fileName: fileName,
        callbackEventName: "PDF_ANNOTATIONS_PRINTER"
      };
      this.sendMessage(data);
    },

    openCadURL: function (cadUrl, fileName, cmd) {
      // possible commands: openDrawing, openModel, openCAD
      var absoluteUrl = this.getAbsoluteUrl(cadUrl);
      var data = {
        command: cmd,
        url: absoluteUrl,
        fileName: fileName,
        callbackEventName: "PDF_ANNOTATIONS_PRINTER"
      };
      this.sendMessage(data);
    },

    print: function () {
      var pdfUrl = PDFViewerApplication.pdfDocumentProperties.url;
      var absoluteUrl = this.getAbsoluteUrl(pdfUrl);
      var fileName = /[^\/]*$/.exec(pdfUrl)[0];
      var data = {
        command: "printPdf",
        url: absoluteUrl,
        fileName: fileName,
        callbackEventName: "PDF_ANNOTATIONS_PRINTER"
      };
      this.sendMessage(data);
    },

    printURL: function (pdfUrl, fileName) {
      var absoluteUrl = this.getAbsoluteUrl(pdfUrl);
      var data = {
        command: "printPdf",
        url: absoluteUrl,
        fileName: fileName,
        callbackEventName: "PDF_ANNOTATIONS_PRINTER"
      };
      this.sendMessage(data);
    },

    getBlobUrl: function (cb) {
      PDFViewerApplication.pdfDocument.getData().then(
        function (data) {
          var blob = new Blob([data], {type: "application/pdf"});
          var blobUrl = URL.createObjectURL(blob);
          cb(blobUrl);
        }
      )
    },

    extensionNotInstallWindowClose: function () {
      OverlayManager.close(this.extensionNotInstallWindowName);
    },

    onExtensionNotInstallDownloadClick: function () {
      window.open("https://www.flatterfiles.com/host");
      OverlayManager.close(this.extensionNotInstallWindowName);
    },

    hostAppNotInstallWindowClose: function () {
      OverlayManager.close(this.hostAppNotInstallWindowName);
    },

    onHostAppNotInstallDownloadClick: function () {
      window.open("https://www.flatterfiles.com/host");
      OverlayManager.close(this.hostAppNotInstallWindowName);
    },

    acrobatNotInstallWindowClose: function () {
      OverlayManager.close(this.acrobatNotInstallWindowName);
    },

    onAcrobatNotInstallDownloadClick: function () {
      window.open("https://get.adobe.com/reader/");
      OverlayManager.close(this.acrobatNotInstallWindowName);
    },

    pdfStartDownloadWindowClose: function () {
      OverlayManager.close(this.pdfStartDownloadWindowName);
    },

    onWindowMessage: function (e) {
      if (e.source !== window) {
        return;
      }

      if (e.data.eventName === "PDF_ANNOTATIONS_PRINTER") {
        this.onMessageFromExtension(e.data);
      }
    },

    onMessageFromExtension: function (request) {
      var a = window.CADView_PDFViewController;
      if (!request) {
        a.displayPrintWindow("ExtensionNotInstalled");
        //OverlayManager.open(this.extensionNotInstallWindowName);
        return;
      }

      switch (request.command) {
        case "openAppInstallationWindow":
          a.displayPrintWindow("HostNotInstalled");
          break;
        case "openAcrobatInstallationWindow":
          a.displayPrintWindow("ReaderNotInstalled");
          break;
        case "openEdrawingInstallationWindow":
          a.displayPrintWindow("eDrawingsNotInstalled");
          break;
        case "openEdrawingVersionWindow":
          a.displayPrintWindow("eDrawingsNeedsUpdate");
          break;
        case "openStartDownloadWindow":
          a.displayPrintWindow("DownloadInProgress");
          break;
        case "closeStartDownloadWindow":
          a.displayPrintWindow("DownloadFinished");
          break;
        case "getBlobUrl":
          var self = this;
          this.getBlobUrl(function (blobUrl) {
            var data = {
              command: "returnBlobUrl",
              blobUrl: blobUrl,
              initialCommand: request.initialCommand
            };
            self.sendMessage(data);
          });
          break;
      }
    },

    onKeyDown: function (e) {
      if (e.ctrlKey && e.keyCode === 80) {
        this.print();
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    },

    sendMessage: function (data) {
      if (typeof PDF_ACROBAT_PRINTER_EXTENSION_INSTALLED === "undefined") {
        if (window.navigator.userAgent.toLowerCase().indexOf('firefox') < 0)
        {
          // this is chrome so possible that old extension is still installed
          chrome.runtime.sendMessage("nilliopfnijnmfhbeamlobibgmcmjljk", data, this.onMessageFromExtension.bind(this));
        }
        else
        {
          this.onMessageFromExtension();
        }
      }

      var event = new CustomEvent("PdfPrinter-resend", {"detail": data});
      document.dispatchEvent(event);
    },

    getAbsoluteUrl: (function () {
      var a;

      return function (url) {
        if (!a) a = document.createElement("a");
        a.href = url;

        return a.href;
      };
    })()
  };

  function pdfAcrobatPrinterLoad() {
    if (!isWinChrome) return;

    if (typeof PDFViewerApplication === "object" && PDFViewerApplication.initialized) {
      OverlayManager = PDFViewerApplication.overlayManager;

      pdfAcrobatPrinter.initialize({
        extensionNotInstallWindowName: "acrobatPrinterExtensionNotInstallOverlay",
        extensionNotInstallCloseButton: document.getElementById("acrobatPrinterExtensionNotInstallClose"),
        extensionNotInstallDownloadButton: document.getElementById("acrobatPrinterExtensionNotInstallDownload"),
        extensionNotInstallCancelButton: document.getElementById("acrobatPrinterExtensionNotInstallCancel"),
        hostAppNotInstallWindowName: "acrobatPrinterHostAppNotInstallOverlay",
        hostAppNotInstallCloseButton: document.getElementById("acrobatPrinterHostAppNotInstallClose"),
        hostAppNotInstallDownloadButton: document.getElementById("acrobatPrinterHostAppNotInstallDownload"),
        hostAppNotInstallCancelButton: document.getElementById("acrobatPrinterHostAppNotInstallCancel"),
        acrobatNotInstallWindowName: "acrobatPrinterAcrobatNotInstallOverlay",
        acrobatNotInstallCloseButton: document.getElementById("acrobatPrinterAcrobatNotInstallClose"),
        acrobatNotInstallDownloadButton: document.getElementById("acrobatPrinterAcrobatNotInstallDownload"),
        acrobatNotInstallCancelButton: document.getElementById("acrobatPrinterAcrobatNotInstallCancel"),
        pdfStartDownloadWindowName: "acrobatPrinterPdfStartDownloadOverlay",
        pdfStartDownloadCloseButton: document.getElementById("acrobatPrinterPdfStartDownloadClose"),
        pdfStartDownloadOkButton: document.getElementById("acrobatPrinterPdfStartDownloadOk"),
        printButton: document.getElementById("print"),
        downloadButton: document.getElementById("download")
      });
    } else {
      setTimeout(pdfAcrobatPrinterLoad, 20);
    }
  }

  document.addEventListener("DOMContentLoaded", pdfAcrobatPrinterLoad);

