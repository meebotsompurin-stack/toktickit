export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('toktickit_token');
  
  // Only override Content-Type if it's not a FormData body
  const isFormData = options.body instanceof FormData;
  
  const headers = new Headers(options.headers);
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let msg = `HTTP error! Status: ${response.status}`;
    try {
      const eData = await response.json();
      msg = eData.message || eData.error || msg;
      
      // Global interceptor for password change requirement
      if (response.status === 403 && msg === 'Password change required') {
        window.location.href = '/change-password';
        return;
      }
    } catch {}
    throw new Error(msg);
  }
  return response.json();
};

interface GetTicketsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  priority?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getTickets = async (params: GetTicketsParams = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    else query.append('page', '1');
    
    if (params.limit) query.append('limit', params.limit.toString());
    else query.append('limit', '10');

    if (params.search) query.append('search', params.search);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.priority) query.append('priority', params.priority);
    if (params.status) query.append('status', params.status);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return await apiFetch(`/api/tickets?${query.toString()}`, { method: 'GET' });
  } catch (error) {
    console.error('API Error - getTickets:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    return await apiFetch('/api/categories', { method: 'GET' });
  } catch (error) {
    console.error('API Error - getCategories:', error);
    throw error;
  }
};

export const getRelatedSystems = async () => {
  try {
    return await apiFetch('/api/related-systems', { method: 'GET' });
  } catch (error) {
    console.error('API Error - getRelatedSystems:', error);
    throw error;
  }
};

export const createTicket = async (data: any) => {
  try {
    return await apiFetch('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('API Error - createTicket:', error);
    throw error;
  }
};

export const uploadAttachmentToTicket = async (ticketId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('attachment', file);

    return await apiFetch(`/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('API Error - uploadAttachmentToTicket:', error);
    throw error;
  }
};

export const getTicketById = async (ticketId: string) => {
  try {
    return await apiFetch(`/api/tickets/${ticketId}`, { method: 'GET' });
  } catch (error) {
    console.error('API Error - getTicketById:', error);
    throw error;
  }
};

export const deleteAttachment = async (_ticketId: string, attachmentId: string) => {
  try {
    return await apiFetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
  } catch (error) {
    console.error('API Error - deleteAttachment:', error);
    throw error;
  }
};

export const downloadAttachment = async (ticketId: string, attachmentId: string, filename: string) => {
  try {
    const token = localStorage.getItem('toktickit_token');
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('Forbidden');
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('API Error - downloadAttachment:', error);
    throw error;
  }
};

export const addPublicComment = async (ticketId: string, content: string) => {
  try {
    return await apiFetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error('API Error - addPublicComment:', error);
    throw error;
  }
};

export const getTicketComments = async (ticketId: string) => {
  try {
    return await apiFetch(`/api/tickets/${ticketId}/comments`, { method: 'GET' });
  } catch (error) {
    console.error('API Error - getTicketComments:', error);
    throw error;
  }
};

export const toggleAppearsResolved = async (ticketId: string, appearsResolved: boolean) => {
  try {
    return await apiFetch(`/api/tickets/${ticketId}/resolution-flag`, {
      method: 'PATCH',
      body: JSON.stringify({ appearsResolved }),
    });
  } catch (error) {
    console.error('API Error - toggleAppearsResolved:', error);
    throw error;
  }
};

export const updateStaffTicketOwner = async (ticketId: string) => {
  try {
    return await apiFetch(`/api/staff/tickets/${ticketId}/owner`, {
      method: 'PATCH',
    });
  } catch (error) {
    console.error('API Error - updateStaffTicketOwner:', error);
    throw error;
  }
};

export const updateStaffTicketPriority = async (ticketId: string, itPriority: string) => {
  try {
    return await apiFetch(`/api/staff/tickets/${ticketId}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ itPriority }),
    });
  } catch (error) {
    console.error('API Error - updateStaffTicketPriority:', error);
    throw error;
  }
};

export const updateStaffTicketStatus = async (ticketId: string, status: string) => {
  try {
    return await apiFetch(`/api/staff/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error('API Error - updateStaffTicketStatus:', error);
    throw error;
  }
};

export const getStaffTickets = async (params: any = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`/api/staff/tickets${query ? '?' + query : ''}`, { method: 'GET' });
  } catch (error) {
    console.error('API Error - getStaffTickets:', error);
    throw error;
  }
};

export const getTicketNotes = async (ticketId: string) => {
  try {
    return await apiFetch(`/api/tickets/${ticketId}/notes`, { method: 'GET' });
  } catch (error) {
    console.error('API Error - getTicketNotes:', error);
    throw error;
  }
};

export const addTicketNote = async (ticketId: string, content: string) => {
  try {
    return await apiFetch(`/api/tickets/${ticketId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error('API Error - addTicketNote:', error);
    throw error;
  }
};
