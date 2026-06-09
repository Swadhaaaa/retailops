import React from 'react';

const AdminTicketDetails = ({
  drawerTicket,
  drawerMessages,
  drawerMessageText,
  setDrawerMessageText,
  drawerIsMessageSubmitting,
  handleCloseDrawer,
  handleDrawerAgentChange,
  handleDrawerStatusChange,
  handleSendDrawerMessage,
  downloadAttachment,
  getRelativeTime,
  getAssignedTeam,
  agents,
  quickReplies
}) => {
  if (!drawerTicket) return null;

  const assignedTeam = getAssignedTeam(drawerTicket.category_name || `Cat #${drawerTicket.category_id}`);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        onClick={handleCloseDrawer}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 opacity-100" 
      />
      
      {/* Drawer panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-brandNavy bg-brandNavy/10 border border-brandNavy/20 px-2 py-0.5 rounded-lg font-sora">
                {drawerTicket.ticket_id}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border font-sora ${
                drawerTicket.status === 'Open'
                  ? 'bg-brandNavy/10 text-brandNavy border-brandNavy/20'
                  : drawerTicket.status === 'In Progress'
                    ? 'bg-brandNavy/10 text-brandNavy border-brandNavy/20'
                    : drawerTicket.status === 'Resolved'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {drawerTicket.status}
              </span>
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 font-sora mt-1.5 max-w-[340px] truncate leading-none">
              {drawerTicket.title}
            </h2>
          </div>
          <button 
            onClick={handleCloseDrawer}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Meta Attributes Panel */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-150 text-xs">
            <div>
              <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Raised By</span>
              <span className="font-extrabold text-slate-700 break-all font-dmSans">{drawerTicket.raised_by}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Category</span>
              <span className="font-extrabold text-slate-700 font-dmSans">{drawerTicket.category_name || `Category #${drawerTicket.category_id}`}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Assigned Team</span>
              <span className="font-extrabold text-brandNavy font-dmSans">{assignedTeam}</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Created Date</span>
              <span className="font-extrabold text-slate-700 font-dmSans">
                {drawerTicket.created_at ? new Date(drawerTicket.created_at).toLocaleString() : 'Today'}
              </span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
            {/* Assign Agent */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 block font-sora">Assign Agent</label>
              <select
                value={drawerTicket.assigned_to || 'Unassigned'}
                onChange={e => handleDrawerAgentChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-750 focus:outline-none focus:border-brandNavy font-dmSans"
              >
                <option>Unassigned</option>
                {agents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            {/* Edit Status */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 block font-sora">Update Status</label>
              <select
                value={drawerTicket.status || 'Open'}
                onChange={e => handleDrawerStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-750 focus:outline-none focus:border-brandNavy font-dmSans"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Query Description */}
          <div>
            <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 font-sora">Query Description</h3>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-650 leading-relaxed font-dmSans min-h-[80px] whitespace-pre-wrap">
              {drawerTicket.description}
            </div>
          </div>

          {/* Attachment */}
          {drawerTicket.has_attachment && (
            <div>
              <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 font-sora">Attachment</h3>
              <button
                onClick={() => downloadAttachment(drawerTicket.attachment_path)}
                className="flex items-center space-x-2 px-4 py-2 bg-brandNavy/10 hover:bg-brandNavy/10 text-brandNavy font-bold rounded-xl text-xs transition-colors font-dmSans border border-brandNavy/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Download Attachment</span>
              </button>
            </div>
          )}

          {/* Message Thread / Chat Section */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-sora">Activity Feed & Messages</h3>
            
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {drawerMessages.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4 font-dmSans">No activity messages yet. Send a response below.</p>
              ) : (
                drawerMessages.map((msg, i) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div key={i} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs font-dmSans leading-relaxed ${
                        isAdmin 
                          ? 'bg-brandNavy text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                      }`}>
                        <p>{msg.message_text}</p>
                        {msg.has_attachment && (
                          <button
                            onClick={() => downloadAttachment(msg.attachment_path)}
                            className={`mt-1.5 flex items-center space-x-1 font-bold text-[10px] underline ${
                              isAdmin ? 'text-white/80 hover:text-white' : 'text-brandNavy hover:text-brandNavy'
                            }`}
                          >
                            <span>📎 Attachment</span>
                          </button>
                        )}
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">
                        {isAdmin ? 'You' : 'Vendor'} · {getRelativeTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Reply Box */}
            <form onSubmit={handleSendDrawerMessage} className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type a message or select a quick reply..."
                value={drawerMessageText}
                onChange={e => setDrawerMessageText(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-250 rounded-xl text-xs focus:outline-none focus:border-brandNavy text-slate-850 font-dmSans bg-slate-50/50 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={drawerIsMessageSubmitting}
                className="bg-brandNavy hover:bg-brandDarkNavy disabled:bg-brandNavy/50 text-white p-2.5 rounded-xl transition-all shadow-md shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>

            {/* Quick replies in drawer */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickReplies.slice(0, 3).map((reply, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDrawerMessageText(reply)}
                  className="text-[9px] font-bold text-brandNavy bg-brandNavy/10 hover:bg-brandNavy/20 border border-brandNavy/20 rounded-lg px-2.5 py-1.5 transition-all text-left"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminTicketDetails;
