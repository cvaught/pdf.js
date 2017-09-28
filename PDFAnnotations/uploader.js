/**
 * Created by chrisvaught on 12/7/15.
 */
self.onmessage = function (e) {

    var uploadedIdents = "",
        count = 0,
        content = e.data[0],
        pdfIdent = e.data[1],
        pdfContent = e.data[2],
        pdfFilename = e.data[3],
        userIdent = e.data[4];

    var handleUpload = (function(filename, fileblob, pagenum)
    {
        // get the upload url
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/uploadURL/gcs/annotate", false);
        xhr.send();

        var uploadUrl = xhr.responseText.trim();
        if (uploadUrl.length == 0 || uploadUrl.lastIndexOf('Error', 0) === 0) {
            // handle error
        }
        else {
            // upload the svg blob to the server
            var formData = new FormData();
            formData.append("fileName", filename);
            formData.append("svgFile", fileblob);
            formData.append("userID", userIdent);
            formData.append("annotationUpload", "YES");
            formData.append("isSVG", "YES");

            if (pagenum)
                formData.append("svgPage", pagenum)

            var xhrForm = new XMLHttpRequest();
            xhrForm.open("POST", uploadUrl, false);
            xhrForm.send(formData);

            try {
                return xhrForm.responseText.trim();
            }
            catch (e) {

            }
        }
    });

    // upload each svg file where each file corresponds to the pages annotations.
    for (var i = 0; i < content.length; i++) {
        if (content[i]) {
            var svg_blob = new Blob([content[i]], {'type': "image/svg+xml"}),
                pageNum = i + 1;

            var ident = handleUpload("page" + pageNum + ".svg", svg_blob, pageNum);
            if (ident)
            {
                count += 1;
                uploadedIdents += ident + ",";
            }
        }
    }

    var message = "";
    if (count > 0)
    {
        if (pdfIdent == null && pdfContent)
        {
            // upload the pdf
            pdfIdent = handleUpload(pdfFilename, pdfContent);
        }

        if (pdfIdent)
        {
            message = uploadedIdents;
            // tell the server to create the annotated pdf using the pdf and svg files
            /*var createUrl = "/create/annotation/?dwgIdent=" + pdfIdent + "&svgFileIdent=" + uploadedIdents + "&userID=" + userIdent;
            var xhr = new XMLHttpRequest();
            xhr.open("POST", createUrl, false);
            xhr.send();
            var result = xhr.responseText.trim();
            if (result.length == 0 || result.lastIndexOf('Error', 0) === 0)
            {
                message = "Error: New PDF could not be created.";
            }
            else
            {
                message = result;
            }*/
        }
        else
        {
            message = "Error: PDF could not be uploaded.";
        }
    }
    else
    {
        message = "Error: No files were uploaded.";
    }
    self.postMessage(message);


};
