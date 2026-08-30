export const getRequesterHeaders = (): HeadersInit => {
  const requesterStr = localStorage.getItem('toktickit_requester');
  let requesterId = '';
  if (requesterStr) {
    try {
      const requester = JSON.parse(requesterStr);
      requesterId = String(requester.id);
    } catch (e) {
      console.error('Error parsing requester:', e);
    }
  }
  return {
    'Content-Type': 'application/json',
    'X-Requester-Id': requesterId,
  };
};

// Helper สำหรับ FormData เนื่องจากไม่ควรเซ็ต Content-Type เอง
export const getFormDataHeaders = (): HeadersInit => {
  const requesterStr = localStorage.getItem('toktickit_requester');
  let requesterId = '';
  if (requesterStr) {
    try {
      const requester = JSON.parse(requesterStr);
      requesterId = String(requester.id);
    } catch (e) {
      console.error('Error parsing requester:', e);
    }
  }
  return {
    'X-Requester-Id': requesterId,
  };
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

    const response = await fetch(`/api/tickets?${query.toString()}`, {
      method: 'GET',
      headers: getRequesterHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error - getTickets:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: getRequesterHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error - getCategories:', error);
    throw error;
  }
};

export const getRelatedSystems = async () => {
  try {
    const response = await fetch('/api/related-systems', {
      method: 'GET',
      headers: getRequesterHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error - getRelatedSystems:', error);
    throw error;
  }
};

export const createTicket = async (data: any) => {
  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: getRequesterHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let msg = 'Failed to create ticket';
      try {
        const eData = await response.json();
        msg = eData.message || msg;
      } catch {}
      throw new Error(msg);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error - createTicket:', error);
    throw error;
  }
};

export const uploadAttachmentToTicket = async (ticketId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('attachment', file);

    const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers: getFormDataHeaders(),
      body: formData,
    });
    
    if (!response.ok) {
      let msg = 'Failed to upload attachment';
      try {
        const eData = await response.json();
        msg = eData.message || msg;
      } catch {}
      throw new Error(msg);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error - uploadAttachmentToTicket:', error);
    throw error;
  }
};

export const getTicketById = async (ticketId: string) => {
  try {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'GET',
      headers: getRequesterHeaders(),
    });
    if (response.status === 403) throw new Error('Forbidden');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error - getTicketById:', error);
    throw error;
  }
};

export const deleteAttachment = async (_ticketId: string, attachmentId: string) => {
  try {
    // The user requested to shoot to /api/tickets/${ticketId}/attachments/${attachmentId}
    // But the backend route in attachment.routes.ts is DELETE /api/attachments/:id
    // Since I cannot edit the backend, I must use the existing backend route.
    const response = await fetch(`/api/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: getRequesterHeaders(),
    });
    if (!response.ok) {
      let msg = 'Failed to delete attachment';
      try {
        const eData = await response.json();
        msg = eData.message || msg;
      } catch {}
      throw new Error(msg);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error - deleteAttachment:', error);
    throw error;
  }
};

export const downloadAttachment = async (ticketId: string, attachmentId: string, filename: string) => {
  try {
    const response = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      method: 'GET',
      headers: getRequesterHeaders(),
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
