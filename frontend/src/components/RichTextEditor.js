import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, onImageUpload }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Clear any existing content first
      editorRef.current.innerHTML = '';
      
      // Initialize Quill
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: {
            container: [
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'color': [] }, { 'background': [] }],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              ['clean']
            ],
            handlers: {
              image: function() {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();

                input.onchange = async () => {
                  const file = input.files[0];
                  if (file && onImageUpload) {
                    try {
                      const imageUrl = await onImageUpload(file);
                      // Get current selection or use end of document
                      const range = quill.getSelection() || { index: quill.getLength() };
                      quill.insertEmbed(range.index, 'image', imageUrl);
                      // Move cursor after the image
                      quill.setSelection(range.index + 1, 0);
                    } catch (error) {
                      console.error('Error uploading image:', error);
                    }
                  }
                };
              }
            }
          }
        }
      });

      // Set initial content
      quill.root.innerHTML = value || '';

      // Handle text changes
      quill.on('text-change', () => {
        const content = quill.root.innerHTML;
        onChange(content);
      });

      quillRef.current = quill;

      // Make toolbar sticky
      const toolbar = editorRef.current.querySelector('.ql-toolbar');
      if (toolbar) {
        toolbarRef.current = toolbar;
        
        const handleScroll = () => {
          const rect = editorRef.current.getBoundingClientRect();
          const toolbarHeight = toolbar.offsetHeight;
          const headerHeight = 64; // Header height (h-16 = 64px)
          
          if (rect.top <= headerHeight && rect.bottom > (toolbarHeight + headerHeight)) {
            toolbar.style.position = 'fixed';
            toolbar.style.top = headerHeight + 'px';
            toolbar.style.left = rect.left + 'px';
            toolbar.style.width = rect.width + 'px';
            toolbar.style.zIndex = '1000';
            toolbar.style.backgroundColor = '#f9fafb';
            toolbar.style.borderBottom = '1px solid #e5e7eb';
            toolbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          } else {
            toolbar.style.position = 'relative';
            toolbar.style.top = 'auto';
            toolbar.style.left = 'auto';
            toolbar.style.width = 'auto';
            toolbar.style.zIndex = 'auto';
            toolbar.style.boxShadow = 'none';
          }
        };
        
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        
        // Store cleanup function
        quill.scrollCleanup = () => {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleScroll);
        };
      }
    }

    // Cleanup
    return () => {
      if (quillRef.current) {
        // Destroy Quill instance
        try {
          if (quillRef.current.scrollCleanup) {
            quillRef.current.scrollCleanup();
          }
          quillRef.current.off('text-change');
          quillRef.current = null;
        } catch (error) {
          console.error('Error cleaning up Quill:', error);
        }
      }
      if (editorRef.current) {
        // Clear all child elements including Quill toolbar and editor
        while (editorRef.current.firstChild) {
          editorRef.current.removeChild(editorRef.current.firstChild);
        }
        editorRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <style>
        {`
          .ql-container {
            border: none !important;
          }
          .ql-editor {
            min-height: 300px;
            padding: 1rem;
            height: 600px;
            overflow-y: auto;
          }
          .ql-editor img {
            max-width: 300px;
            max-height: 200px;
            object-fit: cover;
            border-radius: 4px;
            margin: 10px 0;
            border: 2px solid #e5e7eb;
            cursor: pointer;
          }
          .ql-editor img:hover {
            border-color: #10b981;
          }
          .ql-toolbar {
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
        `}
      </style>
      <div ref={editorRef} className="min-h-[300px]" />
    </div>
  );
};

export default RichTextEditor; 