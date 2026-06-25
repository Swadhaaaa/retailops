import React from 'react';

const RaiseTicketModal = ({
  isOpen,
  isCategoryLocked,
  isVendor,
  isSubmittedSuccessfully,
  submittedTicket,
  handleCloseModal,
  buttonColor,
  handleSubmitTicket,
  formCategory,
  getCategoryPlaceholders,
  formSubject,
  setFormSubject,
  categories,
  setFormCategory,
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
  const [validationErrors, setValidationErrors] = React.useState([]);

  React.useEffect(() => {
    if (!isOpen || isSubmittedSuccessfully) {
      setValidationErrors([]);
    }
  }, [isOpen, isSubmittedSuccessfully]);

  if (!isOpen) return null;

  const clearValidation = () => {
    if (validationErrors.length) setValidationErrors([]);
  };

  const handleValidatedSubmit = (event) => {
    event.preventDefault();

    const missing = [];
    if (!formSubject.trim()) missing.push('Subject / Title is required.');
    if (!formCategory) missing.push('Category is required.');
    if (!formDescription.trim()) missing.push('Description details are required.');

    if (missing.length) {
      setValidationErrors(missing);
      return;
    }

    setValidationErrors([]);
    handleSubmitTicket(event);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-brandNavy/30 backdrop-blur-sm" onClick={handleCloseModal} />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-scale-in transition-all duration-300">
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
            {submittedTicket?.assigned_department && (
              <div className="mt-5 w-full max-w-xs rounded-xl border border-brandNavy/10 bg-brandNavy/5 px-4 py-3 text-left">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 font-sora">
                  Assigned to Department
                </p>
                <p className="mt-1 text-sm font-extrabold text-brandDarkNavy font-sora">
                  {submittedTicket.assigned_department}
                </p>
                {submittedTicket.ticket_id && (
                  <p className="mt-1 text-[10px] font-bold text-gray-500">
                    Ticket ID: {submittedTicket.ticket_id}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={handleCloseModal}
              aria-label="Close window"
              className={`mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-all shadow-md ${buttonColor}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.4" stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="max-h-[86vh] overflow-y-auto p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-brandDarkNavy font-sora">Raise New Query</h3>
                <p className="mt-1 text-sm font-semibold text-gray-500">Submit a ticket to operations</p>
              </div>
              <button onClick={handleCloseModal} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleValidatedSubmit} noValidate className="space-y-5">
              {validationErrors.length > 0 && (
                <div className="rounded-xl border border-brandRed/20 bg-red-50 px-4 py-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-brandRed font-sora">
                    Please complete missing details
                  </p>
                  <ul className="mt-2 space-y-1 text-xs font-bold text-brandRed">
                    {validationErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Subject / Title</label>
                <input type="text" placeholder={getCategoryPlaceholders(formCategory).subject}
                  value={formSubject} onChange={e => { clearValidation(); setFormSubject(e.target.value); }}
                  className={`w-full rounded-xl border bg-gray-50/50 px-4 py-3.5 text-sm outline-none transition-all focus:ring-1 focus:ring-brandNavy/20 ${validationErrors.some(error => error.includes('Subject')) ? 'border-brandRed focus:border-brandRed' : 'border-gray-200 focus:border-brandNavy'}`} />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">
                    Category
                  </label>
                  <select value={formCategory} onChange={e => { clearValidation(); setFormCategory(e.target.value); }} disabled={isCategoryLocked}
                    className={`w-full rounded-xl border bg-gray-50/50 px-4 py-3.5 text-sm font-medium text-gray-700 outline-none transition-all cursor-pointer ${validationErrors.some(error => error.includes('Category')) ? 'border-brandRed focus:border-brandRed' : 'border-gray-200'} ${isCategoryLocked ? 'bg-gray-150/70 border-gray-200/50 text-gray-400 cursor-not-allowed' : 'focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20'}`}>
                    {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Description</label>
                <textarea rows={5} placeholder={getCategoryPlaceholders(formCategory).description}
                  value={formDescription} onChange={e => {
                    clearValidation();
                    const value = e.target.value;
                    setFormDescription(value);
                    if (!isCategoryLocked) {
                      getAISuggestion(value);
                    }
                  }}
                  className={`w-full resize-none rounded-xl border bg-gray-50/50 px-4 py-3.5 text-sm font-medium text-gray-700 outline-none transition-all focus:ring-1 focus:ring-brandNavy/20 ${validationErrors.some(error => error.includes('Description')) ? 'border-brandRed focus:border-brandRed' : 'border-gray-200 focus:border-brandNavy'}`} />
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
                <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Attachment Optional</label>
                <div
                  onDragOver={handleDragOver} onDrop={handleDrop}
                  onClick={() => document.getElementById('dashboard-file-upload').click()}
                  className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-5 text-center transition-all hover:border-brandNavy/30 hover:bg-gray-50/50"
                >
                  <input id="dashboard-file-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.xlsx" onChange={(event) => { clearValidation(); handleFileChange(event); }} />
                  {!attachment ? (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brandNavy/10 text-brandNavy">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-brandDarkNavy font-sora">Click to upload or drag</p>
                      <p className="mt-1 text-xs font-medium text-gray-400">Optional: PDF, JPG, PNG, XLSX (25MB max)</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-7 h-7 text-brandRed mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <p className="max-w-sm truncate text-sm font-bold text-brandDarkNavy font-sora">{attachment.name}</p>
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={handleCloseModal}
                  className="rounded-xl border border-gray-200 px-6 py-3 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className={`flex items-center gap-2 rounded-xl px-8 py-3 text-xs font-bold text-white shadow-md transition-all duration-300 ${buttonColor} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
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
