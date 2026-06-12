import React from 'react';

const RaiseTicketModal = ({
  isOpen,
  isCategoryLocked,
  isVendor,
  isSubmittedSuccessfully,
  handleCloseModal,
  buttonColor,
  handleSubmitTicket,
  formCategory,
  getCategoryPlaceholders,
  formSubject,
  setFormSubject,
  categories,
  setFormCategory,
  formPriority,
  setFormPriority,
  formDescription,
  setFormDescription,
  getAISuggestion,
  aiLoading,
  aiSuggestion,
  handleApplyAISuggestion,
  handleDragOver,
  handleDrop,
  handleFileChange,
  attachment,
  setAttachment,
  attachmentError,
  isSubmitting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-brandNavy/30 backdrop-blur-sm" onClick={handleCloseModal} />
      <div className={`relative bg-white w-full ${isCategoryLocked ? 'max-w-xl' : 'max-w-md'} rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-scale-in transition-all duration-300`}>
        <div className={`h-2 w-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
        
        {isSubmittedSuccessfully ? (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px] animate-fade-in font-dmSans">
            <div className="checkmark-wrapper">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-brandDarkNavy font-sora mt-4">
              Query Submitted Successfully!
            </h3>
            <p className="text-xs text-gray-500 mt-2 font-semibold max-w-xs leading-relaxed">
              Your ticket has been raised. Support coordinators will update you shortly.
            </p>
            <button
              onClick={handleCloseModal}
              className={`mt-6 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${buttonColor}`}
            >
              Close Window
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-brandDarkNavy font-sora">Raise New Query</h3>
                <p className="text-xs text-gray-500 mt-0.5">Submit a ticket to operations</p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Subject / Title</label>
                <input type="text" required placeholder={getCategoryPlaceholders(formCategory).subject}
                  value={formSubject} onChange={e => setFormSubject(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20 transition-all text-sm bg-gray-50/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">
                    Category
                  </label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} disabled={isCategoryLocked}
                    className={`w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none transition-all text-xs bg-gray-50/50 cursor-pointer font-medium text-gray-700 ${isCategoryLocked ? 'bg-gray-150/70 border-gray-200/50 text-gray-400 cursor-not-allowed' : 'focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20'}`}>
                    {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Priority</label>
                  <select value={formPriority} onChange={e => setFormPriority(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20 transition-all text-xs bg-gray-50/50 cursor-pointer font-medium text-gray-700">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Description</label>
                <textarea required rows={isCategoryLocked ? 4 : 2} placeholder={getCategoryPlaceholders(formCategory).description}
                  value={formDescription} onChange={e => {
                    const value = e.target.value;
                    setFormDescription(value);
                    if (!isCategoryLocked) {
                      getAISuggestion(value);
                    }
                  }}
                  className="w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20 transition-all text-sm bg-gray-50/50 resize-none font-medium text-gray-700" />
                {!isCategoryLocked && aiLoading && (
                  <p className="mt-1.5 text-[10px] font-bold text-brandNavy">
                    Analyzing ticket...
                  </p>
                )}
                {!isCategoryLocked && aiSuggestion && (
                  <div className="mt-2 rounded-lg border border-brandNavy/10 bg-brandNavy/5 px-3 py-2 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold text-brandDarkNavy">
                      💡 AI Suggested Category: <span className="text-brandNavy">{aiSuggestion}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyAISuggestion}
                      className="shrink-0 rounded-md bg-brandNavy px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-brandDarkNavy disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Attachment</label>
                <div
                  onDragOver={handleDragOver} onDrop={handleDrop}
                  onClick={() => document.getElementById('dashboard-file-upload').click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50/50 hover:border-brandNavy/30 transition-all flex flex-col items-center justify-center min-h-[90px]"
                >
                  <input id="dashboard-file-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.xlsx" onChange={handleFileChange} />
                  {!attachment ? (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-brandNavy/10 text-brandNavy flex items-center justify-center mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-brandDarkNavy font-sora">Click to upload or drag</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">PDF, JPG, PNG, XLSX (25MB max)</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-7 h-7 text-brandRed mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <p className="text-xs font-bold text-brandDarkNavy truncate max-w-[160px] font-sora">{attachment.name}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5 font-bold">{(attachment.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button type="button" onClick={e => { e.stopPropagation(); setAttachment(null); }}
                        className="mt-1.5 text-[9px] font-extrabold text-brandRed hover:underline uppercase tracking-wider">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                {attachmentError && <p className="text-xs text-brandRed font-bold mt-1">{attachmentError}</p>}
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button type="button" onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !formSubject || !formDescription}
                  className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all duration-300 flex items-center gap-1.5 ${buttonColor} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /><span>Submitting...</span></>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg><span>Submit</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaiseTicketModal;
