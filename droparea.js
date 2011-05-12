(function( $ ){
    var s;
    // Methods
    var m = {
        init: function(e){},
        start: function(e){},
        complete: function(r){},
        error: function(r){ alert(r.error); return false; },
        traverse: function(files,area){
            if (typeof files !== "undefined") {
                for (var i=0, l=files.length; i<l; i++) {
                    m.upload(files[i], area);
                }
            } else {
                area.html(nosupport);
            }
        },
        upload: function(file, area){
            //area.empty();
            var progress = $('<div>',{
                'class':'progress'
            });
            area.append(progress);
			
            // File type control
            if (typeof FileReader === "undefined" || !(/image/i).test(file.type)) {
                //area.html(file.type,s.noimage);
                alert('only image files: jpeg, png, gif');
                return false;
            }

            // File size control
            if (file.size > (s.maxsize * 1024)) {
                //area.html(file.type,s.maxsize);
                alert('max upload size: ' + s.maxsize + 'Kb');
                return false;
            }
			
            // Uploading - for Firefox, Google Chrome and Safari
            var xhr = new XMLHttpRequest();
            // Update progress bar
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    var loaded = Math.ceil((e.loaded / e.total) * 100) + "%";
                    progress.css({
                        'height':loaded
                    }).html(loaded);
                }
            }, false);
			
            // File uploaded
            xhr.addEventListener("load", function (e) {
                var r = jQuery.parseJSON(e.target.responseText);
                s.complete(r);
                area.find('img').remove();
                area.data('value',r.filename)
                .append($('<img>',{'src': r.path + r.filename + '?' + Math.random()}));
                progress.addClass('uploaded');
                progress.html(s.uploaded).fadeOut('slow');
            }, false);
			
            xhr.open("post", s.post, true);
            
            // Set appropriate headers
            xhr.setRequestHeader("content-type", "multipart/form-data");
            xhr.setRequestHeader("x-file-name", file.fileName);
            xhr.setRequestHeader("x-file-size", file.fileSize);
            xhr.setRequestHeader("x-file-type", file.type);

            // Set request headers
            for (var i in area.data())
                if (typeof area.data(i) !== "object")
                    xhr.setRequestHeader('x-param-'+i, area.data(i));

            xhr.send(file);
        }
    };
    $.fn.droparea = function(o) {
        // Settings
        s = {
            'init': m.init,
            'start': m.start,
            'complete': m.complete,
            'instructions': 'drop an image file here',
            'over'        : 'drop file here!',
            'nosupport'   : 'No support for the File API in this web browser',
            'noimage'     : 'Unsupported file type!',
            'uploaded'    : 'Uploaded',
            'maxsize'     : '500', //Kb
            'post'        : 'upload.php'
        };
        this.each(function(){
            if(o) $.extend(s, o);
            var instructions = $('<div>').appendTo($(this));
            s.init($(this));            
            if(!$(this).data('value'))
                instructions.addClass('instructions').html(s.instructions);

            $(this)
            .bind({
                dragleave: function (e) {
                    e.preventDefault();
                    if($(this).data('value'))
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
                }
            });
            this.addEventListener("drop", function (e) {
                e.preventDefault();
                s.start($(this));
                m.traverse(e.dataTransfer.files, $(this));
                instructions.removeClass().empty();
            },false);
        });
    };
})( jQuery );
