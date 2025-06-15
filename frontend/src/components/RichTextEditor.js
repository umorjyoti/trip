import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, onImageUpload }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
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
    }

    // Cleanup
    return () => {
      if (quillRef.current) {
        quillRef.current = null;
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
      <div ref={editorRef} className="min-h-[300px]" />
    </div>
  );
};

export default RichTextEditor; 