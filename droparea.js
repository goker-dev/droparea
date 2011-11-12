(function( $ ){
    var s;
    // Methods
    var m = {
        init: function(){},
        start: function(){},
        complete: function(){},
        error: function(){
            return 0;
        },
        traverse: function(files, input, area){
            if (typeof files !== "undefined") {
                for (var i=0, l=files.length; i<l; i++) {
                    m.control(files[i], input, area);
                }
            } else {
                area.html(nosupport);
            }
        },
        control: function(file, input, area){
        	
            var tld = file.name.toLowerCase().split(/\./);
            tld = tld[tld.length -1];
        	
            //var types = $(area).data('type').split(/,/);
        	
            // File type control
            //for(var i = types.length; i >= 0; i--){
            //typeof FileReader === "undefined" ||
            if (input.data('type') && !types.indexOf(file.type)) {
                //area.html(file.type,s.noimage);
                //var types = $(area).data('type') ? $(area).data('type') : 'jpg, png, gif';
                //alert('only image files: ' + types);
                s.error({
                    'error':'only image files: ' + input.data('type')
                }, input, area);
                return false;
            }
            //}
			
            // File size control
            if (file.size > (s.maxsize * 1048576)) {
                //area.html(file.type,s.maxsize);
                s.error({
                    'error':'max upload size: ' + s.maxsize + 'Mb'
                }, input, area);
                return false;
            }
                        
            // If the file is an image and data-resize paramater is true, 
            // before the uploading resize the imege on browser.
            if((/image/i).test(file.type) && input.data('canvas'))
                m.resize(file, input, area);
            else
                m.upload(file, input, area);
        },
        resize: function(file, input, area){
            
            // for using after the resize
            var name = file.name;
        		
            // Create new objects
            var canvas = document.createElement("canvas");
            //$(canvas).appendTo(area);
            var img = document.createElement("img");
        	
            var WIDTH  = 0 | input.data('width');
            var HEIGHT = 0 | input.data('height');
			
            // Read the file
            var reader = new FileReader();  
            reader.onloadend = function(e) { 
                img.src = e.target.result; 
				
                // Calculate new sizes
                // Get dimensions
                var width = img.width;
                var height = img.height;
                var crop = input.data('crop');
                if ((WIDTH && width > WIDTH) || (HEIGHT && height > HEIGHT)) {
                    ratio = width / height;
                    if ((ratio >= 1 || HEIGHT == 0) && WIDTH && !crop) {
                        width  = WIDTH;
                        height = WIDTH / ratio;
                    } else if (crop && ratio <= (WIDTH / HEIGHT)) {
                        width  = WIDTH;
                        height = WIDTH / ratio;
                    } else {
                        width  = HEIGHT * ratio;
                        height = HEIGHT;
                    }
                }
		        
                // Draw new image
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
				
                var data = canvas.toDataURL("image/jpeg");
				
                // Data checking
                if (data.length <= 6) {
                    s.error({
                        'error':'Image did not created. Please, try again.'
                    }, input, area);
                    return 0;					
                } else {
                    
                    // Get new file data from canvas and convert to blob
                    file = m.dataURItoBlob(data);
                    file.name = name;
                    
                    if(input.data('post')){
                        // Start upload new file
                        m.upload(file, input, area);
                    } else {
                        $(canvas).appendTo(area);
                        input.attr('disabled','disabled');
                        $('<input>').attr('name',input.attr('name'))
                        .val(data).insertAfter(input);
                    }
                }
            }
            reader.readAsDataURL(file);
        },
        upload: function(file, input, area){
        	
            area.find('div').empty();
            var progress = $('<div>',{
                'class':'progress'
            });
            area.append(progress);
			
            // Uploading - for Firefox, Google Chrome and Safari
            var xhr = new XMLHttpRequest();
            xhr.open("post", input.data('post'), true);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            // Update progress bar
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    var loaded = Math.ceil((e.loaded / e.total) * 100);
                    progress.css({
                        'height':loaded + "%",
                        'line-height': (area.height() * loaded / 100) +'px'
                    }).html(loaded + "%");
                }
            }, false);
            // File uploaded
            xhr.addEventListener("load", function (e) {
                var result = jQuery.parseJSON(e.target.responseText);
                
                // Calling complete function
                s.complete(result, file, input, area);
                
                progress.addClass('uploaded');
                progress.html(s.uploaded).fadeOut('slow');
            }, false);
            /*
            // Manual Sending
            var boundary = '----dropareaBoundry' + Math.random(1000000,9999999);
            xhr.setRequestHeader('Content-Type','multipart/form-data; boundary='+boundary); // simulate a file MIME POST request.  
            var body = '';
            for (var i in input.data())
                if (typeof input.data(i) !== "object")
                    body += '--' + boundary + "\r\n"
                    + 'Content-Disposition: form-data; name="' + i + "\"\r\n\r\n"  
                    + input.data(i)+ "\r\n";
            var read = function(e){                
                body += '--' + boundary + "\r\n"
                + 'Content-Disposition: form-data; name="' + input.attr('name') + '"; filename="' + file.name + '"'+"\r\n"
                + 'Content-Type: ' + file.type + "\r\n\r\n"
                + e.target.result + "\r\n"
                + '--' + boundary + '--';  
                console.log(body);
                xhr.send(body);
            };
            var reader = new FileReader();
            // Firefox 3.6, WebKit
            if(reader.addEventListener) {
                reader.addEventListener('loadend', read, false);
            // Chrome 7
            } else {
                reader.onloadend = read;
            }
            reader.readAsBinaryString(file);
            */
            // Create a new formdata
            var fd = new FormData();
            // Add optional form data
            for (var i in input.data())
                if (typeof input.data(i) !== "object")
                    fd.append(i, input.data(i));
            // Add file data
            fd.append(input.attr('name'), file);
            // Send data
            xhr.send(fd);
        },
        dataURItoBlob: function(dataURI){
            // for check the original function: http://stackoverflow.com/questions/4998908/
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs
            var byteString = atob(dataURI.split(',')[1]);
            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
            // write the bytes of the string to an ArrayBuffer
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            // write the ArrayBuffer to a blob, and you're done
            var bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)();
            bb.append(ab);
            return bb.getBlob(mimeString);
        }
    };
    $.fn.droparea = function(o) {
        // Settings
        s = {
            'init'        : m.init,
            'start'       : m.start,
            'complete'    : m.complete,
            'instructions': 'drop a file to here',
            'over'        : 'drop file here!',
            'nosupport'   : 'No support for the File API in this web browser',
            'noimage'     : 'Unsupported file type!',
            'uploaded'    : 'Uploaded',
            'maxsize'     : '10' //Mb
        };
        if(o) $.extend(s, o);
        this.each(function(){
            var area = $('<div class="'+$(this).attr('class')+'">').insertAfter($(this));
            var instructions = $('<div>').appendTo(area);
            var input = $(this).appendTo(area);
            //var input = $('<input type="file" multiple>').appendTo($(this));
            
            s.init($(this));            
            if(input.data('value') && input.data('value').length)
                $('<img src="'+input.data('value')+'">').appendTo(area);
            else 
                instructions.addClass('instructions').html(s.instructions);

            // Drag events
            $(document).bind({
                dragleave: function (e) {
                    e.preventDefault();
                    if(input.data('value') || area.find('img').length)
                        instructions.removeClass().empty();
                    else
                        instructions.removeClass('over').html(s.instructions);
                },
                drop: function (e) {
                    e.preventDefault();
                    if(input.data('value') || area.find('img').length)
                        instructions.removeClass().empty();
                    else
                        instructions.removeClass('over').html(s.instructions);
                },
                dragenter: function (e) {
                    e.preventDefault();
                    instructions.addClass('instructions over').html(s.over);
                },
                dragover: function (e) {
                    e.preventDefault();
                    instructions.addClass('instructions over').html(s.over);
                }
            });
            
            // Drop file event
            this.addEventListener("drop", function (e) {
                e.preventDefault();
                s.start($(this));
                m.traverse(e.dataTransfer.files, input, area);
                instructions.removeClass().empty();
            },false);
            
            // Browse file event
            input.change(function(e){
                m.traverse(e.target.files, input, area);
            });
           
        });
    };
})( jQuery );