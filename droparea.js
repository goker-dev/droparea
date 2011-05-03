(function( $ ){
	var area, s;
	// Methods
	var m = {
		traverse: function(files){
			if (typeof files !== "undefined") {
				for (var i=0, l=files.length; i<l; i++) {
					m.upload(files[i]);
				}
			} else {
				$(area).html(nosupport);
			}	
		},
		upload: function(file){
			$(area).empty();
			var progress = $('<div>',{'class':'progress'}),	xhr, requests;
			$(area).append(progress);
			
			// File type control
			if (typeof FileReader === "undefined" || !(/image/i).test(file.type)) {
				$(area).html(file.type,s.noimage); 
				alert('only image files: jpeg, png, gif');
				return false;
			}

			// File size control
			if (file.size > (s.maxsize * 1024)) {
				$(area).html(file.type,s.noimage); 
				alert('max upload size: ' + s.maxsize + 'Kb');
				return false;
			}
			
			// Uploading - for Firefox, Google Chrome and Safari
			xhr = new XMLHttpRequest();
			// Update progress bar
			xhr.upload.addEventListener("progress", function (e) {
				if (e.lengthComputable) {
					var loaded = Math.ceil((e.loaded / e.total) * 100) + "%";
					progress.css({'height':loaded}).html(loaded);
				}
			}, false);
			
			// File uploaded
			xhr.addEventListener("load", function (e) {
			    $(area).html(e.target.responseText);
				progress.addClass('uploaded');
				progress.html(s.uploaded).fadeOut('slow');
			}, false);
			
			// Set request parameters
			requests = '?width=' + $(area).data('width')
    			     + '&height=' + $(area).data('height')
    			     + '&type=' + $(area).data('type')
    			     + '&crop=' + $(area).data('crop')
    			     + '&quality=' + $(area).data('quality');
			
			xhr.open("post", s.post + requests, true); 
            
            // Set appropriate headers
		    xhr.setRequestHeader("Content-Type", "multipart/form-data");
		    xhr.setRequestHeader("X-File-Name", file.fileName);
		    xhr.setRequestHeader("X-File-Size", file.fileSize);
		    xhr.setRequestHeader("X-File-Type", file.type);

		    xhr.send(file);
		}
	};
	$.fn.droparea = function(o) {
		// Settings
	    s = {
			'instructions'	: 'drop an image file here',
			'over'			: 'drop file here!',
			'nosupport'		: 'No support for the File API in this web browser',
			'noimage'		: 'Unsupported file type!',
			'uploaded'		: 'Uploaded',
			'maxsize'		: '500', //Kb
			'post'			: 'upload.php'
	    };
		this.each(function(){
			if(o) $.extend(s, o);
		    $(this)
			    .html(s.instructions)
			    .bind({
			    dragleave: function (e) {
					e.preventDefault();
					e.stopPropagation();
					var target = e.target;
					if (target && target === area) {
						$(this).removeClass('over').html(s.instructions);
					}
				},
				dragenter: function (e) {
					e.preventDefault();
					e.stopPropagation();
					area = this;
			    	$(this).addClass('over').html(s.over);
				},
				dragover: function (e) {
					e.preventDefault();
					e.stopPropagation();
				}
			    });
			this.addEventListener("drop", function (e) {
				m.traverse(e.dataTransfer.files);
				e.preventDefault();
		    	e.stopPropagation();
				$(this).removeClass('over');
			},false);				
		});
	};
})( jQuery );
