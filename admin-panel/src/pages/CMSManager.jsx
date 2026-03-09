import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, FileText, Globe, EyeOff, Save } from 'lucide-react';
import { fetchCMSPages, saveCMSPage, deleteCMSPage, getCMSPage } from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Add css for snow theme

export default function CMSManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    slug: '',
    content: '',
    is_published: 0
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Markdown toolbar options
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await fetchCMSPages();
      if (res.success) {
        setPages(res.data || []);
      } else {
        setError('Failed to load pages');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleEdit = async (pageSummary) => {
    setIsEditing(true);
    setSaveLoading(true);
    try {
       // Fetch full content
       const res = await getCMSPage(pageSummary.slug);
       if (res.success && res.data) {
           setFormData({
               id: res.data.id,
               title: res.data.title,
               slug: res.data.slug,
               content: res.data.content || '',
               is_published: parseInt(res.data.is_published) || 0
           });
       }
    } catch(e) {
       alert("Failed to load page content.");
       setIsEditing(false);
    } finally {
        setSaveLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({ id: null, title: '', slug: '', content: '', is_published: 0 });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this page? This cannot be undone.")) return;
    try {
      const res = await deleteCMSPage(id);
      if (res.success) {
        loadPages();
      } else {
        alert("Failed to delete page.");
      }
    } catch (e) {
      alert("Error deleting page: " + e.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
        alert("Title and URL Slug are required.");
        return;
    }
    
    setSaveLoading(true);
    try {
        const res = await saveCMSPage(formData);
        if (res.success) {
            setIsEditing(false);
            loadPages();
        } else {
            alert(res.error || "Failed to save page.");
        }
    } catch (e) {
        alert("Error saving page: " + e.message);
    } finally {
        setSaveLoading(false);
    }
  };

  const handleSlugify = () => {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData({...formData, slug});
  };

  return (
    <div className="animate-fade-in pb-10">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Content Management</h1>
          <p className="text-gray-400">Create and edit standalone pages (About, Terms, etc.)</p>
        </div>
        {!isEditing && (
          <button onClick={handleCreateNew} className="btn-primary flex items-center gap-2 px-5 py-2.5">
            <Plus size={18} /> New Page
          </button>
        )}
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
          <X size={20} /> {error}
        </div>
      )}

      {isEditing ? (
        <div className="card glass animate-fade-in p-6 sm:p-8">
           <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
             <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-blue-500" />
                {formData.id ? 'Edit Page' : 'Create New Page'}
             </h2>
             <button onClick={() => setIsEditing(false)} className="btn-secondary px-4 py-2">Cancel</button>
           </div>

           <form onSubmit={handleSave} className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-300">Page Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      onBlur={!formData.id && !formData.slug ? handleSlugify : undefined}
                      placeholder="e.g. About Us"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-300 flex justify-between">
                        URL Slug 
                        <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={handleSlugify}>Auto-generate</span>
                    </label>
                    <div className="flex items-center">
                        <span className="bg-white/5 border border-r-0 border-white/10 rounded-l-xl px-3 py-3 text-gray-500">/</span>
                        <input 
                        type="text" 
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                        placeholder="about-us"
                        className="bg-white/5 border border-white/10 rounded-r-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors w-full"
                        required
                        />
                    </div>
                  </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                  <input 
                     type="checkbox" 
                     id="is_published"
                     checked={formData.is_published === 1}
                     onChange={(e) => setFormData({...formData, is_published: e.target.checked ? 1 : 0})}
                     className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                  />
                  <div className="flex flex-col">
                      <label htmlFor="is_published" className="font-bold cursor-pointer">Published to Storefront</label>
                      <span className="text-xs text-gray-400">If unchecked, this page will only be visible to administrators.</span>
                  </div>
              </div>

              {/* Editor */}
              <div className="flex flex-col gap-2 relative z-0">
                  <label className="text-sm font-bold text-gray-300">Page Content</label>
                  <div className="bg-white rounded-xl overflow-hidden text-black custom-quill-container">
                      <ReactQuill 
                         theme="snow" 
                         value={formData.content} 
                         onChange={(val) => setFormData({...formData, content: val})} 
                         modules={modules}
                         style={{ height: '400px', borderBottom: 'none' }}
                      />
                  </div>
              </div>

              <div className="flex justify-end mt-12 pt-6 border-t border-white/10">
                  <button 
                     type="submit" 
                     disabled={saveLoading}
                     className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
                  >
                      {saveLoading ? <span className="animate-spin text-xl">⟳</span> : <Save size={20} />}
                      {saveLoading ? 'Saving...' : 'Save Page'}
                  </button>
              </div>
           </form>

           <style>{`
             .custom-quill-container .ql-toolbar { border: none; border-bottom: 1px solid #e5e7eb; background: #f8fafc; padding: 12px; }
             .custom-quill-container .ql-container { border: none !important; font-family: 'Inter', 'Outfit', sans-serif !important; font-size: 15px; }
             .custom-quill-container .ql-editor { padding: 24px; }
           `}</style>
        </div>
      ) : (
        <div className="card glass">
           {loading ? (
             <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                 <span className="animate-spin text-3xl mb-4 text-blue-500">⟳</span>
                 Loading pages...
             </div>
           ) : pages.length === 0 ? (
             <div className="p-16 text-center flex flex-col items-center">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <FileText size={24} className="text-gray-400" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">No pages found</h3>
                 <p className="text-gray-400 mb-6">Create your first custom page to display on the storefront.</p>
                 <button onClick={handleCreateNew} className="btn-primary px-6 py-2">Create Page</button>
             </div>
           ) : (
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead>
                         <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                             <th className="p-4 font-bold">Page Title</th>
                             <th className="p-4 font-bold">URL Route</th>
                             <th className="p-4 font-bold">Status</th>
                             <th className="p-4 font-bold">Last Updated</th>
                             <th className="p-4 font-bold text-right">Actions</th>
                         </tr>
                     </thead>
                     <tbody>
                         {pages.map(page => (
                             <tr key={page.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-4">
                                     <div className="font-bold flex items-center gap-2">
                                         <FileText size={16} className="text-blue-400" />
                                         {page.title}
                                     </div>
                                 </td>
                                 <td className="p-4">
                                     <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded text-gray-300">
                                         /{page.slug}
                                     </span>
                                 </td>
                                 <td className="p-4">
                                     {parseInt(page.is_published) === 1 ? (
                                         <span className="flex w-fit items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                            <Globe size={12} /> Published
                                         </span>
                                     ) : (
                                         <span className="flex w-fit items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                            <EyeOff size={12} /> Draft
                                         </span>
                                     )}
                                 </td>
                                 <td className="p-4 text-sm text-gray-400">
                                     {new Date(page.updated_at).toLocaleDateString('en-GB')}
                                 </td>
                                 <td className="p-4 flex gap-2 justify-end">
                                     <button 
                                        onClick={() => handleEdit(page)}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-colors text-gray-400"
                                        title="Edit Page"
                                     >
                                         <Edit size={14} />
                                     </button>
                                     <button 
                                        onClick={() => handleDelete(page.id)}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors text-gray-400"
                                        title="Delete Page"
                                     >
                                         <Trash2 size={14} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
